
## m(...)
m() also extends Float32Array. Pass it a single number and it will give you the relevant n-by-n zero matrix.

	m( 3 )		// returns a blank 3x3 matrix
	
For an m-by-n matrix, pass two numbers.
The first will determine the number of rows ( the codomain ), and the second will determine the number of columns ( the domain ).
These numbers will be stored in the resulting matrix's .domain and .codomain properties.

	m( 2, 3 )	// returns a matrix with 2 rows and 3 columns

The m() constructor can't initialize values, as the domain and codomain need to be initialized first.
To populate the matrix, use the methods .assign(), .from_rows(), .from_columns(), .from_quaternion(), .look_at(), or .face_towards().

> Matrix elements are stored in column-major order, for compatibility with webgl and GLSL.

## m() Methods
### .row( index ), .column( index )
Returns the nth row or column of this matrix as a vector

	m.identity(3).row(0) // returns v(1,0,0)

### .assign( indices, value )
Assigns a value to the element at the given set of indices

	m(3).assign([1,1], 5) // returns a 3x3 matrix with 5 in the middle

### .from_rows( ...vectors ), .from_columns( ...vectors )
Assigns values to this matrix using row or column vectors. An empty string can be used to skip a row.

	m(2).from_rows([1,2], "")	// returns  1 2
				  	//	    0 0

	m(2).from_columns([3,4], "")	// returns  3 0
					//	    4 0

### .transform( ...vectors )
Transforms vectors and returns them. If multiple vectors are given, the return value is an array

### .multiply( matrix )
Returns the left-multiplication of this and another matrix.

### Static Methods
m.identity(n) returns an nxn identity matrix.
