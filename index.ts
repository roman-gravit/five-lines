
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;


class Player {
	private x = 1;
	private y = 1;

	getX(): number {
		return this.x;
	}
	setX(x: number): void {
		this.x = x;
	}

	getY(): number {
		return this.y;
	}
	setY(y: number): void {
		this.y = y;
	}

	draw(g: CanvasRenderingContext2D) {
		g.fillStyle = "#ff0000";
		g.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}

	moveVertical(dy: number): void {
		if (map.getMap()[this.y + dy][this.x].isEdible()) {
			this.moveToTile(map, this.x, this.y + dy);
		} 
	}

	moveToTile(map: GameMap, newx: number, newy: number) {
		map.movePlayer(this.x, this.y, newx, newy);
		this.x = newx;
		this.y = newy;
	}
}
let player: Player = new Player();


let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];

class GameMap {
	private map: Tile[][];

	constructor() {
		this.map = new Array(rawMap.length);
		for (let y = 0; y < rawMap.length; y++) {
			this.map[y] = new Array(rawMap[y].length);
			for (let x = 0; x < rawMap[y].length; x++) {
				this.map[y][x] = transformTile(rawMap[y][x]);
			}
		}
	}

	getMap(): Tile[][] {
		return this.map;
	}

	draw(g: CanvasRenderingContext2D) {
		for (let y = 0; y < this.map.length; y++) {
			for (let x = 0; x < this.map[y].length; x++) {
				this.map[y][x].draw(g, x, y);
			}
		}
	}

	update() {
		for (let y = this.map.length - 1; y >= 0; y--) {
			for (let x = 0; x < this.map[y].length; x++) {
				this.map[y][x].update(y, x);
			}
		}
	}

	drop(tile: Tile, x: number, y: number): void {
		this.map[y + 1][x] = tile;
		this.map[y][x] = new Air();
	}
	
	getBlockOnTopState(x: number, y: number): FallingState {
		return this.map[y + 1][x].getBlockOnTopState()
	}

	remove(shouldRemove: RemoveStrategy) {
		for (let y = 0; y < this.map.length; y++) {
			for (let x = 0; x < this.map[y].length; x++) {
				if (shouldRemove.check(this.map[y][x])) {
					this.map[y][x] = new Air();
				}
			}
		}
	}

	movePlayer(x: number, y: number, newx: number, newy: number) {
		this.map[y][x] = new Air();
		this.map[newy][newx] = new PlayerTile();
	}
}

let map = new GameMap();

enum RawTile {
  AIR,
  FLUX,
  UNBREAKABLE,
  PLAYER,
  STONE, FALLING_STONE,
  BOX, FALLING_BOX,
  KEY1, LOCK1,
  KEY2, LOCK2
}


interface Tile {
	isAir(): boolean;
	isLock1(): boolean;
	isLock2(): boolean;
	draw(g: CanvasRenderingContext2D, x: number, y: number): void;
	isEdible(): boolean;
	moveHorizontal(player: Player, dx: number): void;
	moveVertical(player: Player, dy: number): void;
	update(y: number, x: number): void;
	getBlockOnTopState(): FallingState;
}

interface FallingState {
	drop(map: GameMap, tile: Tile, x: number, y: number): void;
	moveHorizontal(player: Player, dx: number): void;
}

class Falling implements FallingState {
	drop(map: GameMap, tile: Tile, x: number, y: number): void {
		map.drop(tile, x, y);
	}

	moveHorizontal(player: Player, dx: number): void { }
}

class Resting implements FallingState {
	drop(map: GameMap, tile: Tile, x: number, y: number): void {
		//
	}
	
	moveHorizontal(player: Player, dx: number): void {
		if ( map.getMap()[player.getY()][player.getX() + dx + dx].isAir()
			&& !map.getMap()[player.getY() + 1][player.getX() + dx].isAir()) 
		{
			map.getMap()[player.getY()][player.getX() + dx + dx] = map.getMap()[player.getY()][player.getX() + dx];
		   player.moveToTile(map, player.getX() + dx, player.getY());
		}
	}
}

class FallStrategy {
	constructor(private falling: FallingState)  {}

	update(map: GameMap, tile: Tile, x: number, y: number): void {
		this.falling = map.getBlockOnTopState(x, y);
		this.falling.drop(map, tile, x, y);
	}

	moveHorizontal(player: Player, dx: number) {
		this.falling.moveHorizontal(player, dx);
	}
}
class Stone implements Tile {
	private fallStrategy: FallStrategy;

	constructor(falling: FallingState) {
		this.fallStrategy = new FallStrategy(falling);
	}
	getBlockOnTopState(): FallingState {
		return new Resting();
	}

	update(x: number, y: number): void {
		this.fallStrategy.update(map, this, x, y);
	}
	moveVertical(player: Player, dy: number): void { }
	moveHorizontal(player: Player, dx: number): void {
		this.fallStrategy.moveHorizontal(player, dx);
	}
	isEdible(): boolean {
		return false;
	}
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = "#0000cc";
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean {
		return false;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}
}

class Box implements Tile {
	private fallStrategy: FallStrategy;

	constructor(falling: FallingState) {
		this.fallStrategy = new FallStrategy(falling);
	}
	getBlockOnTopState(): FallingState {
		return new Resting();
	}

	update(x: number, y: number): void {
		this.fallStrategy.update(map, this, x, y);
	}

	moveVertical(player: Player, dy: number): void { }
	moveHorizontal(player: Player, dx: number): void {
		this.fallStrategy.moveHorizontal(player, dx);
	}
	isEdible(): boolean {
		return false;
	}
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = "#8b4513";
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean {
		return false;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}
}

class Air implements Tile {
	getBlockOnTopState(): FallingState {
		return new Falling();
	}
	update(y: number, x: number): void {
		//
	}
	moveVertical(player: Player, dy: number): void {
		player.moveVertical(dy);
	}
	moveHorizontal(player: Player, dx: number): void {
		player.moveToTile(map, player.getX() + dx, player.getY());
	}
	isEdible(): boolean {
		return true;
	}
	
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		//
	}
	isAir(): boolean {
		return true;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}

}

class Flux implements Tile {
	getBlockOnTopState(): FallingState {
		return new Resting();
	}
	update(y: number, x: number): void {
		//
	}
	moveVertical(player: Player, dy: number): void {
		player.moveVertical(dy);
	}
	moveHorizontal(player: Player, dx: number): void {
		player.moveToTile(map, player.getX() + dx, player.getY());
	}
	isEdible(): boolean {
		return true;
	}
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = "#ccffcc";
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean {
		return false;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}
}

class KeyConfiguration {
	constructor(private color: string,
				private _1: boolean,
				private removeStrategy: RemoveStrategy) {}
	is1() { 
		return this._1;
	}
	removeLock() {
		map.remove(this.removeStrategy);
	}
	setColor(g: CanvasRenderingContext2D) {
		g.fillStyle = this.color;
	}
	fillRectangle(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
		g.fillRect(x, y, w, h);
	}
}

class Key implements Tile {

	constructor(private keyConf: KeyConfiguration) {}
	getBlockOnTopState(): FallingState {
		return new Resting();
	}

	update(y: number, x: number): void {}

	moveVertical(player: Player, dy: number): void {
		this.keyConf.removeLock();
		player.moveToTile(map, player.getX(), player.getY() + dy);
	}

	moveHorizontal(player: Player, dx: number): void {
		this.keyConf.removeLock();
		player.moveToTile(map, player.getX() + dx, player.getY());
	}

	isEdible(): boolean { return false; }
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		this.keyConf.setColor(g);
		this.keyConf.fillRectangle(g, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean { return false; }
	isLock1(): boolean { return false; }
	isLock2(): boolean { return false; }
}

class LockN implements Tile {
	constructor(private keyConf: KeyConfiguration) {}
	getBlockOnTopState(): FallingState {
		return new Resting();
	}

	isLock1(): boolean { return this.keyConf.is1(); }
	isLock2(): boolean { return !this.keyConf.is1(); }
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		this.keyConf.setColor(g);
		this.keyConf.fillRectangle(g, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean { return false; }
	update(y: number, x: number): void { }
	moveVertical(player: Player, dy: number): void { }
	moveHorizontal(player: Player, dx: number): void { }
	isEdible(): boolean { return false; }
}

class PlayerTile implements Tile {
	getBlockOnTopState(): FallingState {
		return new Resting();
	}
	update(y: number, x: number): void {
		//
	}
	moveVertical(player: Player, dy: number): void { }
	moveHorizontal(player: Player, dx: number): void { }
	isEdible(): boolean {
		return false;
	}
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		//
	}
	isAir(): boolean {
		return false;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}
}

class Unbreakable implements Tile {
	getBlockOnTopState(): FallingState {
		return new Resting();
	}
	update(y: number, x: number): void {
		//
	}
	moveVertical(player: Player, dy: number): void { }
	moveHorizontal(player: Player, dx: number): void { }
	isEdible(): boolean {
		return false;
	}
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = "#999999";
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean {
		return false;
	}
	isLock1(): boolean {
		return false;
	}
	isLock2(): boolean {
		return false;
	}
}

interface Input {
	handle(player: Player): void;
}

class Up implements Input {
	handle(player: Player): void {
		map.getMap()[player.getY() -1][player.getX()].moveVertical(player, -1);
	}
}

class Down implements Input {
	handle(player: Player): void {
		map.getMap()[player.getY() + 1][player.getX()].moveVertical(player, 1);
	}
}

class Left implements Input {
	handle(player: Player): void {
		map.getMap()[player.getY()][player.getX() -1].moveHorizontal(player, -1);
	}
}

class Right implements Input {
	handle(player: Player): void {
		map.getMap()[player.getY()][player.getX() + 1].moveHorizontal(player, 1);
	}
}


interface RemoveStrategy {
	check(tile: Tile): boolean;
}
class RemoveLock1 implements RemoveStrategy {
	check(tile: Tile): boolean {
		return tile.isLock1();
	}
}

class RemoveLock2 implements RemoveStrategy {
	check(tile: Tile): boolean {
		return tile.isLock2();
	}
}

const YELLOW_KEY = new KeyConfiguration("#ffcc00", true, new RemoveLock1());
const BLUE_KEY = new KeyConfiguration("#00ccff", false, new RemoveLock2());

function transformTile(tile: RawTile): Tile {
	switch(tile) {
		case RawTile.AIR: return new Air();
		case RawTile.BOX: return new Box(new Resting());
		case RawTile.FALLING_BOX: return new Box(new Falling());
		case RawTile.PLAYER: return new PlayerTile();
		case RawTile.UNBREAKABLE: return new Unbreakable();
		case RawTile.STONE: return new Stone(new Resting());
		case RawTile.FALLING_STONE: return new Stone(new Falling());
		case RawTile.FLUX: return new Flux();
		case RawTile.KEY1: return new Key(YELLOW_KEY);
		case RawTile.LOCK1: return new LockN(YELLOW_KEY);
		case RawTile.KEY2: return new Key(BLUE_KEY);
		case RawTile.LOCK2: return new LockN(BLUE_KEY);
		default: assertExhausted(tile);
	}
}

function assertExhausted(x: never): never {
	throw new Error("Unexpected object:" + x);
}

let inputs: Input[] = [];


function update() {
	handleInputs();
	map.update();
}

function draw() {
  const g = createGraphics();
  map.draw(g);
  player.draw(g);
}

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(() => gameLoop(), sleep);
}

window.onload = () => {
	gameLoop();
}

const LEFT_KEY = "ArrowLeft";
const UP_KEY = "ArrowUp";
const RIGHT_KEY = "ArrowRight";
const DOWN_KEY = "ArrowDown";
window.addEventListener("keydown", e => {
	if (e.key === LEFT_KEY || e.key === "a") { 
		inputs.push(new Left());
	
	} else if (e.key === UP_KEY || e.key === "w") { 
		inputs.push(new Up()); 
	
	} else if (e.key === RIGHT_KEY || e.key === "d") { 
		inputs.push(new Right());
	
	} else if (e.key === DOWN_KEY || e.key === "s") {
		inputs.push(new Down());
	} 
});


// refactoring
function createGraphics(): CanvasRenderingContext2D {
    let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
    let g = canvas.getContext("2d");

    g.clearRect(0, 0, canvas.width, canvas.height);
    return g;
}

function handleInputs() {
	while (inputs.length > 0) {
		let current = inputs.pop();
		current.handle(player);
	}
}

