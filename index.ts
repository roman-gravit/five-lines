
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

let playerx = 1;
let playery = 1;
let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];

let map: Tile[][];

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
	moveHorizontal(dx: number): void;
	moveVertical(dy: number): void;
	update(y: number, x: number): void;
}

interface FallingState {
	isFalling(): boolean;
}

class Falling implements FallingState {
	isFalling(): boolean {
		return true;
	}
}

class Resting implements FallingState {
	isFalling(): boolean {
		return false;
	}
}

class FallStrategy {
	constructor(private falling: FallingState)  {

	}

	update(tile: Tile, x: number, y: number): void {
		this.falling = map[y + 1][x].isAir()
			? new Falling()
			: new Resting();
		this.drop(tile, x, y);
	}

	private drop(tile: Tile, x: number, y: number): void {
		if (map[y + 1][x].isAir()) {
		    map[y + 1][x] = tile;
		    map[y][x] = new Air();
	    }
	}

	isFalling(): FallingState {
		return this.falling;
	}
}
class Stone implements Tile {
	private fallStrategy: FallStrategy;

	constructor(falling: FallingState) {
		this.fallStrategy = new FallStrategy(falling);
	}

	update(x: number, y: number): void {
		this.fallStrategy.update(this, x, y);
	}
	moveVertical(dy: number): void {
		//
	}
	moveHorizontal(dx: number): void {
		if(this.fallStrategy.isFalling().isFalling()===true) {
			//
		} else if(this.fallStrategy.isFalling().isFalling()===false) {
			if ( map[playery][playerx + dx + dx].isAir()
				&& !map[playery + 1][playerx + dx].isAir()) 
		    {
			   map[playery][playerx + dx + dx] = map[playery][playerx + dx];
			   moveToTile(playerx + dx, playery);
		    }
		}
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

	update(x: number, y: number): void {
		this.fallStrategy.update(this, x, y);
	}

	moveVertical(dy: number): void {
		//
	}
	moveHorizontal(dx: number): void {
		if(this.fallStrategy.isFalling().isFalling() === true) {
			//
		} else {
			if ( map[playery][playerx + dx + dx].isAir()
				&& !map[playery + 1][playerx + dx].isAir()) 
		   {
			   map[playery][playerx + dx + dx] = map[playery][playerx + dx];
			   moveToTile(playerx + dx, playery);
		   } 
		}
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
	update(y: number, x: number): void {
		//
	}
	moveVertical(dy: number): void {
		if (map[playery + dy][playerx].isEdible()) {
			moveToTile(playerx, playery + dy);
		} 
	}
	moveHorizontal(dx: number): void {
		moveToTile(playerx + dx, playery);
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
	update(y: number, x: number): void {
		//
	}
	moveVertical(dy: number): void {
		if (map[playery + dy][playerx].isEdible()) {
			moveToTile(playerx, playery + dy);
		} 
	}
	moveHorizontal(dx: number): void {
		moveToTile(playerx + dx, playery);
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

	getColor() { 
		return this.color;
	}
	is1() { 
		return this._1;
	}
	getRemoveStrategy() { 
		return this.removeStrategy;
	}
}

class Key implements Tile {

	constructor(private keyConf: KeyConfiguration) {}

	update(y: number, x: number): void {}
	moveVertical(dy: number): void {
		remove(this.keyConf.getRemoveStrategy());
		moveToTile(playerx, playery + dy);
	}
	moveHorizontal(dx: number): void {
		remove(this.keyConf.getRemoveStrategy());
		moveToTile(playerx + dx, playery);
	}
	isEdible(): boolean { return false; }
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = this.keyConf.getColor();
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean { return false; }
	isLock1(): boolean { return false; }
	isLock2(): boolean { return false; }
}

class Lock implements Tile {
	constructor(private keyConf: KeyConfiguration) {}

	isLock1(): boolean { return this.keyConf.is1(); }
	isLock2(): boolean { return !this.keyConf.is1(); }
	draw(g: CanvasRenderingContext2D, x: number, y: number): void {
		g.fillStyle = this.keyConf.getColor();
		g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}
	isAir(): boolean { return false; }
	update(y: number, x: number): void { }
	moveVertical(dy: number): void { }
	moveHorizontal(dx: number): void { }
	isEdible(): boolean { return false; }
}

class Player implements Tile {
	update(y: number, x: number): void {
		//
	}
	moveVertical(dy: number): void {
		//
	}
	moveHorizontal(dx: number): void {
		//
	}
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
	update(y: number, x: number): void {
		//
	}
	moveVertical(dy: number): void {
		//
	}
	moveHorizontal(dx: number): void {
		//
	}
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
	handle(): void;
}

class Up implements Input {
	handle(): void {
		map[playery -1][playerx].moveVertical(-1);
	}
}

class Down implements Input {
	handle(): void {
		map[playery + 1][playerx].moveVertical(1);
	}
}

class Left implements Input {
	handle(): void {
		map[playery][playerx -1].moveHorizontal(-1);
	}
}

class Right implements Input {
	handle(): void {
		map[playery][playerx + 1].moveHorizontal(1);
	}
}


function transformMap() {
	map = new Array(rawMap.length);
	for (let y = 0; y < rawMap.length; y++) {
		map[y] = new Array(rawMap[y].length);
		for (let x = 0; x < rawMap[y].length; x++) {
			map[y][x] = transformTile(rawMap[y][x]);
		}
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
		case RawTile.PLAYER: return new Player();
		case RawTile.UNBREAKABLE: return new Unbreakable();
		case RawTile.STONE: return new Stone(new Resting());
		case RawTile.FALLING_STONE: return new Stone(new Falling());
		case RawTile.FLUX: return new Flux();
		case RawTile.KEY1: return new Key(YELLOW_KEY);
		case RawTile.LOCK1: return new Lock(YELLOW_KEY);
		case RawTile.KEY2: return new Key(BLUE_KEY);
		case RawTile.LOCK2: return new Lock(BLUE_KEY);
		default: assertExhausted(tile);
	}
}

function assertExhausted(x: never): never {
	throw new Error("Unexpected object:" + x);
}

let inputs: Input[] = [];


function remove(shouldRemove: RemoveStrategy) {
	for (let y = 0; y < map.length; y++) {
		for (let x = 0; x < map[y].length; x++) {
			if (shouldRemove.check(map[y][x])) {
				map[y][x] = new Air();
			}
		}
	}
}

function moveToTile(newx: number, newy: number) {
  map[playery][playerx] = new Air();
  map[newy][newx] = new Player();
  playerx = newx;
  playery = newy;
}


function update() {
	handleInputs();
	updateMap();
}

function draw() {
  const g = createGraphics();
  drawMap(g);
  drawPlayer(g);
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
	transformMap();
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

function drawMap(g: CanvasRenderingContext2D) {
	for (let y = 0; y < map.length; y++) {
    	for (let x = 0; x < map[y].length; x++) {
			map[y][x].draw(g, x, y);
    	}
	}
}

function drawPlayer(g: CanvasRenderingContext2D) {
  g.fillStyle = "#ff0000";
  g.fillRect(playerx * TILE_SIZE, playery * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function handleInputs() {
	while (inputs.length > 0) {
		let current = inputs.pop();
		current.handle();
	}
}

function updateMap() {
	for (let y = map.length - 1; y >= 0; y--) {
		for (let x = 0; x < map[y].length; x++) {
			map[y][x].update(y, x);
		}
	}
}


let hat = {
	name: "Hat",
	price: 100,
	getPriceincTax() {
		return Number(this.price) * 1.2;
	}

};

import Log from "./test";
Log(`Hat: ${hat.price}, ${hat.getPriceincTax() }`);

type ThemeParams = {
	font?: string;
	color: string;
}
type Theme = "dark" | "light";
type AppTheme = Record<Theme, ThemeParams>;


type ThemePartial = Partial<ThemeParams>;
type ThemeRequired = Required<ThemeParams>;
type ThemePick = Pick<ThemeParams, "font">;