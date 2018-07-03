'use strict'

const food = `
type Food {
    id: ID!
    name: String!
    created: Date!
    modified: Date
    foodGroup: FoodGroup!
  }
`

const foodInput = `
input FoodInput {
    name: String!
    foodGroup: String
    foodGroupId: String
  }
`

module.exports = [food, foodInput]
