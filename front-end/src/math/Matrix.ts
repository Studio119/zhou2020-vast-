/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-20 15:23:52 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-20 22:32:26
 */

/**
 * 2d matrix
 * @export
 * @class Matrix
 */
export class Matrix {
    /**
     * contained elements
     * @private
     * @type {Array<Array<number>>}
     * @memberof Matrix
     */
    private _elements: Array<Array<number>>;

    /**
     * the size of the matrix
     * @private
     * @type {[number, number]}
     * @memberof Matrix
     */
    private _size: [number, number];

    /**
     *Creates an instance of Matrix.
     * @param {number} d1 the first dimension length
     * @param {number} [d2=NaN] the second dimension length, default the same as d1
     * @memberof Matrix
     */
    public constructor(d1: number, d2: number = NaN) {
        if (isNaN(d2)) {
            d2 = d1;
        }
        this._size = [d1, d2];
        this._elements = [];
        for (let i: number = 0; i < d1; i++) {
            this._elements.push([]);
            for (let j: number = 0; j < d2; j++) {
                this._elements[i].push(NaN);
            }
        }
    }

    /**
     *Add a matrix(or a number) to this matrix
     * @param {(Matrix | number)} m2 another matrix or a number
     * @param {number} times multiplied times for the second matrix
     * @returns {Matrix} result matrix
     * @memberof Matrix
     */
    public addMatrix(m2: Matrix | number, times: number = 1): Matrix {
        if (typeof m2 === 'number') {
            let rm: Matrix = new Matrix(...this._size);
            let array: Array<Array<number>> = [];
            for (let i: number = 0; i < this._size[0]; i++) {
                array.push([]);
                for (let j: number = 0; j < this._size[1]; j++) {
                    array[i].push(this._elements[i][j] + m2 * times);
                }
            }
            rm.load(array);
            return rm;
        }
        if (this._size[0] !== m2.size()[0] || this._size[1] !== m2.size()[1]) {
            console.error(`Cannot add a ${ m2.size()[0] }x${ m2.size()[1] } matrix `
                + `to a ${ this._size[0] }x${ this._size[1] }matrix`);
            return this;
        }
        let rm: Matrix = new Matrix(...this._size);
        let array: Array<Array<number>> = [];
        for (let i: number = 0; i < this._size[0]; i++) {
            array.push([]);
            for (let j: number = 0; j < this._size[1]; j++) {
                array[i].push(this._elements[i][j] + m2.get(i, j) * times);
            }
        }
        rm.load(array);
        return rm;
    }

    /**
     *Adds a certain times of all elements in one column to another column
     * @param {number} sourceIndex the index of the source column
     * @param {number} times times of each element
     * @param {number} sinkIndex the index of the sink column
     * @returns {Array<number>} copy of the sink column(after this operation)
     * @memberof Matrix
     */
    public columnAddTo(sourceIndex: number, times: number, sinkIndex: number): Array<number> {
        if (sourceIndex === sinkIndex) {
            console.error(`Cannot add elements for column ${ sourceIndex } to column ${ sinkIndex }`);
            return this._elements.map((row: Array<number>) => row[sinkIndex]);
        }
        for (let i: number = 0; i < this._size[0]; i++) {
            this._elements[i][sinkIndex] += this._elements[i][sourceIndex] * times;
        }
        return this._elements.map((row: Array<number>) => row[sinkIndex]);
    }

    /**
     *Multiplies each element in a certain column
     * @param {number} index this index of the column
     * @param {number} times multipied times
     * @returns {Array<number>} copy of the column(after this operation)
     * @memberof Matrix
     */
    public columnMultiply(index: number, times: number): Array<number> {
        if (!(times > 0)) {
            console.error(`Cannot multiplies each element in column ${ index } when times=${ times }`);
            return this._elements.map((row: Array<number>) => row[index]);
        }
        for (let i: number = 0; i < this._size[0]; i++) {
            this._elements[i][index] *= times;
        }
        return this._elements.map((row: Array<number>) => row[index]);
    }

    /**
     *Swaps two columns
     * @param {number} index1 index of column 1
     * @param {number} index2 index of column 2
     * @memberof Matrix
     */
    public columnSwap(index1: number, index2: number): void {
        for (let i: number = 0; i < this._size[0]; i++) {
            let temp: number = this._elements[i][index1];
            this._elements[i][index1] = this._elements[i][index2];
            this._elements[i][index2] = temp;
        }
    }

    /**
     *Gets the copy of the matrix
     * @returns {Matrix} the copy of the matrix
     * @memberof Matrix
     */
    public copy(): Matrix {
        let copy: Matrix = new Matrix(...this._size);
        copy.load(this._elements);
        return copy;
    }

    /**
     *Gets the element at the given position
     * @param {number} d1 cordinate 1
     * @param {number} d2 cordinate 2
     * @returns {number} the value of the element required
     * @memberof Matrix
     */
    public get(d1: number, d2: number): number {
        return this._elements[d1][d2];
    }

    /**
     *Gets a copy of a column of the matrix
     * @param {number} index index of the column
     * @returns {Array<[number]>} copy of the column
     * @memberof Matrix
     */
    public getColumn(index: number): Array<[number]> {
        return this._elements.map((row: Array<number>) => [row[index]]);
    }
    
    /**
     *Gets a copy of a row of the matrix
     * @param {number} index index of the row
     * @returns {[Array<number>]} copy of the row
     * @memberof Matrix
     */
    public getRow(index: number): [Array<number>] {
        return [this._elements[index].map((element: number) => element)];
    }

    /**
     *Checks if the matrix is a square matrix
     * @returns {boolean}
     * @memberof Matrix
     */
    public isSquare(): boolean {
        return this._size[0] === this._size[1];
    }

    /**
     *Loads array as the element set of the matrix
     * @param {Array<Array<number>>} array 2d-array
     * @memberof Matrix
     */
    public load(array: Array<Array<number>>): void {
        for (let i: number = 0; i < this._size[0]; i++) {
            if (array[i] === void(0)) {
                console.error(`Error occured when loading elements for a matrix, received undefined at line ${ i }`);
                return;
            }
            for (let j: number = 0; j < this._size[1]; j++) {
                if (array[i][j] === void(0)) {
                    console.error(`Error occured when loading elements for a matrix, received undefined `
                        + `at position ${ i },${ j }`);
                    return;
                }
                this._elements[i][j] = array[i][j];
            }
        }
    }

    /**
     *Multiplies this matrix by another matrix(or a number)
     * @param {(Matrix | number)} m2 another matrix or a number
     * @returns {Matrix} result matrix
     * @memberof Matrix
     */
    public multiplyMatrix(m2: Matrix | number): Matrix {
        if (typeof m2 === 'number') {
            let rm: Matrix = new Matrix(...this._size);
            let array: Array<Array<number>> = [];
            for (let i: number = 0; i < this._size[0]; i++) {
                array.push([]);
                for (let j: number = 0; j < this._size[1]; j++) {
                    array[i].push(this._elements[i][j] * m2);
                }
            }
            rm.load(array);
            return rm;
        }
        if (this._size[1] !== m2.size()[0]) {
            console.error(`Cannot multiply a ${ this._size[0] }x${ this._size[1] } matrix `
                + `by a ${ m2.size()[0] }x${ m2.size()[1] } matrix`);
            return this;
        }
        let rm: Matrix = new Matrix(this._size[0], m2.size()[1]);
        let array: Array<Array<number>> = [];
        for (let i: number = 0; i < this._size[0]; i++) {
            array.push([]);
            for (let j: number = 0; j < m2.size()[1]; j++) {
                let num: number = 0;
                for (let k: number = 0; k < this._size[1]; k++) {
                    num += this._elements[i][k] * m2.get(k, j);
                }
                array[i].push(num);
            }
        }
        rm.load(array);
        return rm;
    }

    /**
     *Replaces NaN with the given value
     * @param {number} value the number to replace NaN with
     * @returns {number} replaced times
     * @memberof Matrix
     */
    public replaceNaNWith(value: number): number {
        let count: number = 0;
        this._elements.forEach((line: Array<number>) => {
            for (let i: number = 0; i < line.length; i++) {
                if (isNaN(line[i])) {
                    line[i] = value;
                    count++;
                }
            }
        });
        return count;
    }

    /**
     *Gets the reversed matrix
     * @returns {Matrix}
     * @memberof Matrix
     */
    public reverse(): Matrix {
        const matrix = new Matrix(this._size[1], this._size[0]);
        let array: Array<Array<number>> = [];
        for (let i: number = 0; i < this._size[1]; i++) {
            array.push([]);
            for (let j: number = 0; j < this._size[0]; j++) {
                array[i].push(NaN);
            }
        }
        for (let i: number = 0; i < this._size[0]; i++) {
            for (let j: number = 0; j < this._size[1]; j++) {
                array[j][i] = this._elements[i][j];
            }
        }
        matrix.load(array);
        return matrix;
    }

    /**
     *Adds a certain times of all elements in one row to another row
     * @param {number} sourceIndex the index of the source row
     * @param {number} times times of each element
     * @param {number} sinkIndex the index of the sink row
     * @returns {Array<number>} copy of the sink row(after this operation)
     * @memberof Matrix
     */
    public rowAddTo(sourceIndex: number, times: number, sinkIndex: number): Array<number> {
        if (sourceIndex === sinkIndex) {
            console.error(`Cannot add elements for row ${ sourceIndex } to row ${ sinkIndex }`);
            return this._elements[sinkIndex].map((element: number) => element);
        }
        for (let i: number = 0; i < this._size[1]; i++) {
            this._elements[sinkIndex][i] += this._elements[sourceIndex][i] * times;
        }
        return this._elements[sinkIndex].map((element: number) => element);
    }

    /**
     *Multiplies each element in a certain row
     * @param {number} index this index of the row
     * @param {number} times multipied times
     * @returns {Array<number>} copy of the row(after this operation)
     * @memberof Matrix
     */
    public rowMultiply(index: number, times: number): Array<number> {
        if (!(times > 0)) {
            console.error(`Cannot multiplies each element in row ${ index } when times=${ times }`);
            return this._elements[index].map((element: number) => element);
        }
        for (let i: number = 0; i < this._size[1]; i++) {
            this._elements[index][i] *= times;
        }
        return this._elements[index].map((element: number) => element);
    }

    /**
     *Swaps two rows
     * @param {number} index1 index of row 1
     * @param {number} index2 index of row 2
     * @memberof Matrix
     */
    public rowSwap(index1: number, index2: number): void {
        for (let i: number = 0; i < this._size[1]; i++) {
            let temp: number = this._elements[index1][i];
            this._elements[index1][i] = this._elements[index2][i];
            this._elements[index2][i] = temp;
        }
    }

    /**
     *Makes this matrix the least line matrix
     * @memberof Matrix
     */
    public simplify(): void {
        for (let i: number = 0; i < this._size[0] - 1; i++) {
            for (let j: number = i + 1; j < this._size[0]; j++) {
                this.rowAddTo(i, -1 * this._elements[j][i] / this._elements[i][i], j);
                this._elements[j][i] = 0;
            }
        }
        for (let i: number = this._size[0] - 1; i > 0; i--) {
            for (let j: number = i - 1; j >= 0; j--) {
                this.rowAddTo(i, -1 * this._elements[j][i] / this._elements[i][i], j);
                this._elements[j][i] = 0;
            }
        }
    }

    /**
     *Gets the size of the matrix
     * @returns {[number, number]} size of the matrix
     * @memberof Matrix
     */
    public size(): [number, number] {
        return this._size;
    }
};
