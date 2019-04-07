import schema from './index'

test('Schema', it => {

  //Object.keys(schema.type).forEach(key => console.log(`${key},`))

  class TestClass {}

  const testSchema = schema(({
    // All default types
    any,
    required,
    string,
    number,
    array,
    object,
    func,
    bool,
    arrayOf,
    objectOf,
    instanceOf,
    allOf,
    oneOf,
    optional,
    email,        
  }) => ({
    // Test schema
    any: any,
    required: required,
    optional: optional(string),
    string: string,
    number: number,
    array: array,
    object: object,
    func: func,
    bool: bool,
    arrayOf: arrayOf(number),
    objectOf: objectOf({
      key: string
    }),
    instanceOf: instanceOf(TestClass),
    //allOf: allOf(),
    oneOf: oneOf(string, number),
    email: email
  }))

  it('creates a schema', testSchema)
  it('returns a validate function', testSchema instanceof Function)

  const validData = {
    any: 'any',
    required: 'required',
    optional: '1',
    string: 'string',
    number: 1,
    array: [],
    object: {},
    func: () => {},
    bool: true,
    arrayOf: [1, 2, 3],
    objectOf: { key: 'value' },
    instanceOf: new TestClass,
    oneOf: 1,
    email: 'test@test.com'
  }

  const invalidData = {
    optional: 0,
    string: 0,
    number: '1',
    array: {},
    object: [],
    func: 'true',
    bool: 'true',
    arrayOf: ['1'],
    objectOf: {},
    instanceOf: {},
    oneOf: false,
    email: 'wrong'
  }

  let errors = testSchema(validData)
  it('returns null on valid schema', errors===null)
  
  errors = testSchema(invalidData)
  it('returns errors on wrong schema', errors)
  it('returns all errors on wrong schema', Object.keys(errors).length>=Object.keys(invalidData).length)

})

test('Schema: Nested', it => {

  const childSchema = schema(({ string }) => ({
    key: string
  }))

  const parentSchema = schema(() => ({
    child: childSchema
  }))

  let errors = parentSchema({
    child: { key: 'value' }
  })

  it('handles parent with valid child schema', !errors)

  errors = parentSchema({
    child: 'true'
  })

  it('handles parent with invalid child schema', errors.child)

})

test('Schema: Async', async it => {

  it('exists', schema.async)

  const methodsWithAsync = ['objectOf', 'arrayOf', 'allOf', 'oneOf']

  it('has all async methods',
    methodsWithAsync.map(key => schema.type[key].async).filter(f => f)
      .length === methodsWithAsync.length
  )

  const asyncSchema = schema.async(({ string, strictArrayOf }) => ({
    key: string,
    asyncStringCheck: async (value) => await new Promise((resolve, reject) => {
      setTimeout(() => resolve(string(value)), 100)
    }),
    asyncArrayCheck: strictArrayOf.async(string)
  }))

  it('creates an async validate function', asyncSchema() instanceof Promise)

  const validData = {
    key: 'value',
    asyncStringCheck: 'anything',
    asyncArrayCheck: ['1', '2', '3']
  }

  const invalidData = {
    key: 123,
    asyncStringCheck: 123,
    asyncArrayCheck: ['1', '2', 3]
  }

  let errors = await asyncSchema(validData)

  it('returns null on valid schema', !errors)

  errors = await asyncSchema(invalidData)

  it('returns errors on invalid schema', Object.keys(errors).length===Object.keys(invalidData).length)

})
