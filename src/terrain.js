/** # Terrain

*/


var Terrain = exports.Terrain = declare({
	SURROUNDINGS: [
		{dx:-1, dy:-1, cost: Math.SQRT2},
		{dx:-1, dy: 0, cost: 1},
		{dx:-1, dy: 1, cost: Math.SQRT2},
		{dx: 0, dy:-1, cost: 1},
		{dx: 0, dy: 1, cost: 1},
		{dx: 1, dy:-1, cost: Math.SQRT2},
		{dx: 1, dy: 0, cost: 1},
		{dx: 1, dy: 1, cost: Math.SQRT2}
	],

	/** The map of the terrain is made of tiles taken from a tileSet. This is the default tile set.
	*/
	tileSet: [
		//{ passable: true, visible: true },
		{ passable: true, visible: true },
		{ passable: false, visible: false }
	],

	map: [
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000010000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000",
		"000000000000000000000000000000000000000000000000"
	].map(function (line) {
		return new Uint8Array(line.split(''));
	}),

	__unitsByPosition__: {},

	constructor: function Terrain(args) {
		//TODO initialization
		this.width = this.map.length;
		this.height = this.map[0].length;
	},

	resetTerrain: function resetTerrain(wargame){
		this.__unitsByPosition__ = this.unitsByPosition(wargame);
	},

	unitsByPosition: function unitsByPosition(wargame){
		var armies = wargame.armies,
			result = {};
		for (var team in armies) {
			armies[team].units.forEach(function (unit) {
				if (!unit.isDead()){
		          	result[unit.position] = unit;
				}
			});
		}
		return result;
	},

	tileAt: function tileAt(position) {
		var tile = this.map[position[0]] && this.map[position[0]][position[1]];
		return this.tileSet[tile];
	},

	isPassable: function isPassable(position, checkUnits) {
		var tile = this.tileAt(position);
		return !!(tile && tile.passable &&
			(!checkUnits || !this.__unitsByPosition__.hasOwnProperty(position)));
	},

	isVisible: function isVisible(position, checkUnits) {
		var tile = this.tileAt(position);
		return !!(tile && tile.visible &&
			(!checkUnits || !this.__unitsByPosition__.hasOwnProperty(position)));
	},

	distance: function distance(p1, p2) {
		var d0 = Math.abs(p1[0] - p2[0]),
			d1 = Math.abs(p1[1] - p2[1]);
		return Math.sqrt(d0 * d0 + d1 * d1);
	},

	// ## Movement ################################################################################

	/** Returns all reachable positions of the given unit.
	*/
	reachablePositions: function reachablePositions(unit, range) {

		range = range || 12;
		var visited = {},
			pending = [unit.position],
			width = this.width,
			height = this.height,
			SURROUNDINGS = this.SURROUNDINGS,
            	pos, pos2, cost, cost2, delta, tile;
		visited[unit.position] = 0;

		for (var i = 0; i < pending.length; i++) {
			pos = pending[i];
			cost = visited[pos];
			for (var j = 0; j < SURROUNDINGS.length; j++) {
				delta = SURROUNDINGS[j];
				cost2 = cost + delta.cost;
				if (cost2 > range) continue;
				pos2 = [pos[0] + delta.dx, pos[1] + delta.dy];
				if (visited.hasOwnProperty(pos2) || !this.isPassable(pos2, true)) continue;
				visited[pos2] = cost2;
				pending.push(pos2);
			}
		}
	
		return visited;
	},

	/**
	*/
	canReach: function canReach(unit, destination, range) {
		range = range || 12;
		var terrain = this,
			origin = unit.position,
			visited = {},
			pending = [unit.position],
			width = this.width,
			height = this.height,
			SURROUNDINGS = this.SURROUNDINGS,
            	pos, pos2, cost, cost2, delta, tile;
		visited[origin] = 0;
		heuristic[origin] = this.distance(origin, destination);

		for (var i = 0; i < pending.length; i++) {
			pos = pending[i];
			if (pos[0] === destination[0] && pos[1] === destination[1]) {
				return true;
			}
			cost = visited[pos];
			for (var j = 0; j < SURROUNDINGS.length; j++) {
				delta = SURROUNDINGS[j];
				cost2 = cost + delta.cost;
				if (cost2 > range) continue;
				pos2 = [pos[0] + delta.dx, pos[1] + delta.dy];
				if (visited.hasOwnProperty(pos2) || !this.isPassable(pos2, true)) continue;
				visited[pos2] = cost2;
				heuristic[pos2] = this.distance(pos2, destination);
				pending.push(pos2);
			}
			pending.sort(function (p1, p2) {
				return (visited[p1] + heuristic[p1]) - (visited[p2] + heuristic[p2]);
			});
		}
		return false;
	},
	canReachVisible: function canReachVisible(unit, destination,influenceMap,areaOfSight) {
		var terrain = this,
			origin = unit.position,
			range = 42,
			visited = {},
			pending = [unit.position],
			width = this.width,
			height = this.height,
			matrix=[],
			heuristic={},
			SURROUNDINGS = this.SURROUNDINGS,
            	pos, pos2, cost, cost2, delta, tile;
		visited[origin] = 0;
		heuristic[origin] = this.distance(origin, destination);

		for (var i = 0; i < pending.length; i++) {
			pos = pending[i];
			if (pos[0] === destination[0] && pos[1] === destination[1]) {
				return matrix;
			}
			cost = visited[pos];
			for (var j = 0; j < SURROUNDINGS.length; j++) {
				delta = SURROUNDINGS[j];
				cost2 = cost + delta.cost;
				if (cost2 > range) continue;
				pos2 = [pos[0] + delta.dx, pos[1] + delta.dy];
				if (visited.hasOwnProperty(pos2) || !this.isPassable(pos2, true)) continue;
				visited[pos2] = cost2;

				heuristic[pos2] = this.distance(pos2, destination);
				this.sparseMatrix(matrix,pos2,{key:"Sight",value:areaOfSight[pos2]});
				this.sparseMatrix(matrix,pos2,{key:"Influ",value:influenceMap[pos2]});
				this.sparseMatrix(matrix,pos2,{key:"Dist",value:heuristic[pos2]});
				pending.push(pos2);
			}
			pending.sort(function (p1, p2) {
				return (visited[p1] + heuristic[p1]) - (visited[p2] + heuristic[p2]);
			});
		}
		return matrix;
	},
	sparseMatrix:function sparseMatrix(matrix,pos,object){
		if (object.value!=undefined){
		matrix[pos[0]]=matrix[pos[0]] ? matrix[pos[0]] : [];
		matrix[pos[0]][[pos[1]]]=matrix[pos[0]][[pos[1]]] ? matrix[pos[0]][[pos[1]]] : {};
		matrix[pos[0]][[pos[1]]][object.key]=object.value;
		}
	},

	// ## Visibility ##############################################################################

	'dual bresenham': function bresenham(point1, point2, maxRange){
		maxRange = maxRange || Infinity;
		var result = [],
			dx = Math.abs(point2[0] - point1[0]),
			dy = Math.abs(point2[1] - point1[1]),
			sx = (point1[0] < point2[0]) ? 1 : -1,
			sy = (point1[1] < point2[1]) ? 1 : -1,
			curLoc = point1.slice(),
			err = dx - dy,
			e2;
		while (maxRange--){
			result.push(curLoc.slice());
			if (curLoc[0] === point2[0] && curLoc[1] === point2[1]) break;
			e2 = err * 2;
			if (e2 > -dy) {
				err -= dy;
				curLoc[0] += sx;
			}
			if (e2 < dx) {
				err += dx;
				curLoc[1] += sy;
			}
		}
		return result;
	},

	canShoot:function canShoot(shooterUnit, targetUnit){
		if (shooterUnit.army === targetUnit.army) {
			return Infinity;
		}
		var distance = this.distance(shooterUnit.position, targetUnit.position);
		if (distance > shooterUnit.maxRange()) {
			return Infinity;
		} else {
			var sight = this.bresenham(shooterUnit.position, targetUnit.position, distance),
				pos;
			for (var i = 0; i < sight.length; i++) {
				pos = sight[i];
				if (!this.isVisible(pos) || this.__unitsByPosition__[pos] &&
						this.__unitsByPosition__[pos].id !== shooterUnit.id &&
						this.__unitsByPosition__[pos].id !== targetUnit.id) {
					return Infinity;
				}
			}

			return distance;
		}
	},

	areaOfSight: function areaOfSight(unit, radius) {
		radius = radius || Infinity;
		var pos = unit.position,
			terrain = this,
			area = {};
		iterable(this.BRESENHAM_CACHE).forEachApply(function (_, path) {
			var pos2;
			for (var i = 1; i < path.length && i <= radius; i++) {
				pos2 = path[i];
				pos2 = [pos[0] + pos2[0], pos[1] + pos2[1]];
				if (!terrain.isVisible(pos2)) break;
				area[pos2] = i;
				if (terrain.__unitsByPosition__[pos2]) break;
			}
		});
		return area;
	},

	// ## Utilities ###############################################################################

	'static __SERMAT__': {
		serializer: function serialize_Terrain(obj) {
			return [];
		}
	}
}); // declare Terrain

Terrain.BRESENHAM_CACHE = Terrain.prototype.BRESENHAM_CACHE = (function (radius) {
	var pointCache = {},
		result = { radius: radius };

	function cachePath(path) {
		return path.map(function (point) {
			return pointCache[point] || (pointCache[point] = point);
		});
	}

	for (var i = -radius; i <= radius; i++) {
		result[[i, -radius]] = Terrain.bresenham([0, 0], [i, -radius]);
		result[[i, +radius]] = Terrain.bresenham([0, 0], [i, +radius]);
		if (i !== -radius && i !== radius) {
			result[[-radius, i]] = Terrain.bresenham([0, 0], [-radius, i]);
			result[[+radius, i]] = Terrain.bresenham([0, 0], [+radius, i]);
		}
	}
	return result;
})(50);

//var inf= new LW.InfluenceMap(game2,"Red")

var InfluenceMap = exports.InfluenceMap = declare({
	momentum: 0.67,
	decay: 0.3,
	iterations: 30,

	constructor: function InfluenceMap(game, role){
		this.width= game.terrain.width;
		this.height= game.terrain.height;
		this.grid= this.matrix(this.width);
		this.terrain= game.terrain;
		//this.role = role;
		
	},
	matrix:function matrix(dim){
		return  Array(dim).fill(0).map(function(v) {return   Array(dim).fill(0).map(function(v){return 0;});});
	},
	update: function update(game) {
		var influenceMap = this,
			grid = this.grid,
			pos;
		this.role = game.activePlayer();
		this.unitsInfluences(game);
		for (var i = 0; i < this.iterations; i++) {
			grid=this.spread(grid);
		}
		return grid;
	},
	unitsInfluences: function unitsInfluences(game) {
		var imap = this,
			sign,
			grid = this.grid,
			posX,
			posY;
		for (var army in game.armies){
			sign = army === this.role ? +1 : -1;
			game.armies[army].units.forEach(function (unit){
				if (!unit.isDead()) {
					posX = unit.position[0] |0;
					posY = unit.position[1] |0;
					if (!grid[posX]) {
						grid[posX]=[];
						grid[posX][posY]=0;
					}else if (!grid[posX][posY]){
						grid[posX][posY]= 0;
					}
					grid[posX][posY] = imap.influence(unit) * sign;
				}
			});
		}
	},

	influence: function influence(unit) {
		return unit.worth(); //FIXME Too simple?
	},
	getMomentumInf: function getMomentumInf(grid,r,c,decays){
		var v,
			di,dj,inf=0,absInf,absV;
		for ( di = -1; di < 2; di++) {
			for (dj = -1; dj < 2; dj++) {
				if ((di !== 0 || dj !== 0) && grid[r+di] && (v = grid[r+di][c+dj])) {
					v *= decays[di*di+dj*dj];
					absInf =inf<0 ? -inf: inf;
					absV   =v<0 ?   -v  : v;
					//	if (Math.abs(inf) < Math.abs(v)) {
					if (absInf < absV) {
						inf = v;
					}
				}
			}
		}
		return inf;
	},

	spread: function spread(grid) {
	//	var start=Date.now();
		var decay = this.decay,
			decays = [NaN, Math.exp(-1 * decay), Math.exp(-Math.SQRT2 * decay)],
			momentum = this.momentum,
			oneGrid=[],
			value,
			inf,
			terrain=this.terrain;

		for (var r= 0; r <grid.length; r++) {
			for (var c = 0; c < grid[r].length;c++) {
				value=grid[r][c];
				if (terrain.map[r][c]===1){
					oneGrid[r]= !oneGrid[r] ? []: oneGrid[r];
					oneGrid[r][c] =  "t";
				}
				//else if (!isNaN(value)) {
				else{
					inf = this.getMomentumInf(grid,r,c,decays);
					oneGrid[r]= !oneGrid[r] ? []: oneGrid[r];
					oneGrid[r][c] =  value * (1 - momentum) + inf * momentum;
				}
				//else ( console.log("error Here");)
			}
		}
		//console.log(Date.now()- start);
		return oneGrid;

    },


}); // declare InfluenceMap
