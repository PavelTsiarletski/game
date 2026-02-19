window.SURVIVAL = window.SURVIVAL || {};

(function() {
    class SpatialGrid {
        constructor(width, height, cellSize) {
            this.width = width;
            this.height = height;
            this.cellSize = cellSize;
            this.cols = Math.ceil(width / cellSize);
            this.rows = Math.ceil(height / cellSize);
            this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
        }

        clear() {
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].length = 0; // Clear without reallocating
            }
        }

        // Add an entity to the grid (can be in multiple cells if overlapping)
        add(entity) {
            const minX = Math.floor((entity.x - entity.radius) / this.cellSize);
            const maxX = Math.floor((entity.x + entity.radius) / this.cellSize);
            const minY = Math.floor((entity.y - entity.radius) / this.cellSize);
            const maxY = Math.floor((entity.y + entity.radius) / this.cellSize);

            // Clamp to grid bounds
            const startX = Math.max(0, minX);
            const endX = Math.min(this.cols - 1, maxX);
            const startY = Math.max(0, minY);
            const endY = Math.min(this.rows - 1, maxY);

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const index = y * this.cols + x;
                    this.cells[index].push(entity);
                }
            }
        }

        // Retrieve potentially colliding entities
        // We only check the cell the query point is in, or the specific cells an entity covers
        getPotentialCollisions(entity) {
            const minX = Math.floor((entity.x - entity.radius) / this.cellSize);
            const maxX = Math.floor((entity.x + entity.radius) / this.cellSize);
            const minY = Math.floor((entity.y - entity.radius) / this.cellSize);
            const maxY = Math.floor((entity.y + entity.radius) / this.cellSize);

            const startX = Math.max(0, minX);
            const endX = Math.min(this.cols - 1, maxX);
            const startY = Math.max(0, minY);
            const endY = Math.min(this.rows - 1, maxY);

            const results = new Set(); // Use Set to avoid duplicates (entity in multiple cells)

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const index = y * this.cols + x;
                    const cell = this.cells[index];
                    for (let i = 0; i < cell.length; i++) {
                        results.add(cell[i]);
                    }
                }
            }
            return results;
        }
    }

    window.SURVIVAL.SpatialGrid = SpatialGrid;
})();
