lowercase_v provides two array classes:

* FlatArray - constructs a contiguous array of vectors, matrices, or scalars of the same type and dimension
* WovenArray - constructs an interleaved array, which may include multiple vectors, matrices, and/or scalars, so long as each element follows the same format

The FlatArray is simple, fast, but inflexible. Render engines may expect mesh data to be interleaved, describing each vertex with a position, normal, and texture coordinate all in the same array. The WovenArray class provides methods for converting to and from various formats.

> Both constructors extend Float32Array and may define their length by either a number of instances, or a pre-existing array/arraybuffer around which to construct its dataview.

# new FlatArray( n_instances, dimensions )

    let locations = new FlatArray( n_entities,  3  )
    let rotations = new FlatArray( n_entities, [3] )
    let scales    = new FlatArray( n_entities,  1  )

The first parameter is listed as "n_instances" and defines the number of elements in the array. However, if your data already exists as a sorted array or arraybuffer, you can pass that for this argument instead.

The "dimensions" argument accepts a number or array.
* A dimension of 1 returns an array of scalars, functionally equivalent to a Float32Array.
* A number higher than 1 returns an array of vectors
* An array returns an array of matrices

> An array with only one element will be interpreted as a square matrix. [3] is here equivalent to [3, 3]

### .get( id ), .set( id, value )
The getter will either use the v() and m() constructors from lowercase_v, or return an ordinary number, depending on the dimensions defined during construction.

# new WovenArray( n_instances, format )
Like the FlatArray, the first parameter may either be a number, array, or arraybuffer.

The format parameter expects an object whose property names will serve as "tags" for getting and setting the relevant data. The object's properties define the dimensions of that data.

    let entity_data =
    new WovenArray( n_entities, {
      loc: 3,     // 3-dimensional vector
      rot: [3],   // 3x3 matrix
      scale: 1    // a scalar
    })


### .get( id, tag ), .set( id, value, tag )
Gets and sets data at a given index and tag. If no tag is given, the getter and setter will consider the entire element.

    let myFormat = { red: 1, green: 1, blue: 1, alpha: 1 }
    let myWovenArray = new WovenArray( pixelBuffer, myFormat )

    myWovenArray.get( index, "alpha" )     // returns the alpha value at that index
    myWovenArray.get( index )              // returns all data from that index as a WovenArray of the same format

### .weave( arrays = {} )
Populates the WovenArray by interleaving data from arrays with appropriate strides.

    myWovenArray.weave({
      VERTEX:   vertexArray,
      NORMAL:   normalArray,
      TEXCOORD: texcoordArray,
    })

Something to consider is that, if your flat arrays have the same name as your tag, you can execute this function more concisely:

    const VERTEX   = new FlatArray( count, 3 )
    const NORMAL   = new FlatArray( count, 3 )
    const TEXCOORD = new FlatArray( count, 2 )
    myWovenArray.weave({ VERTEX, NORMAL, TEXCOORD })

### .reweave( format = {} )
Constructs a new WovenArray by reordoring its data into a new format; dropping unnecessary attributes, allocating space for new ones, or simply changing the order of what's there.

    let vertices = new WovenArray( buffer, expected_format )
    vertices = vertices.reweave( desired_format )

You may also want to change the dimension. I read this can increases performance, to pad vertex attributes until you reach a power of two, but as always, profile it for yourself before falling for cargo cult programming. Regardless, it'd look something like this:

    let vertices = new WovenArray( buffer, {
      pos: 3,
      uv: 2
    })
    vertices = vertices.reweave({
      pos: 4,
      uv: 4
    })
    
### .unravel( tag )
Returns a FlatArray with the same n_instances consisting of the data from that tag.

# future plans:
Recursive formats sounds like a nice idea. Something like this:

    let format = {
        position: 3,
        texcoord: 2,
        color: {
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1,
        }
    }

But, I haven't yet seen a compelling enough use to consider prioritizing this.
