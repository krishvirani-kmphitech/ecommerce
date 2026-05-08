1. product - category search on slug - done

2. user collection - DONE
primaryAddressId: {
  type: mongoose.Schema.Types.ObjectId
}
for address not store is primary in address add new field like this that store primaryAddress id
    - change address and checkout api.

3. add this field in product - DONE
status: {
  type: String,
  enum: ["ACTIVE", "DELETED", "BLOCKED"],
  default: "ACTIVE"
}
  - product api, checkout api

4. order collection - DONE
paymentStatus: {
  type: String,
  enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
  default: "PENDING"
},

5. transaction collection - DONE
status: {
  type: String,
  enum: ["PENDING", "SUCCESS", "FAILED"],
  default: "PENDING"
}
