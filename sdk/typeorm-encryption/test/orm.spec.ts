import "reflect-metadata";
import { Customer } from "./entity/Customer";
import {expect} from "chai";

describe('orm',  function () {

  it('should be able to encrypt and decrypt data using typeorm-encryption', async function () {

    const customerToAdd: Customer = new Customer();

    customerToAdd.name = 'John'
    customerToAdd.email = 'JohnA@gmail.com'
    customerToAdd.phone = '+972-54-1234567'
    customerToAdd.ssn = '078-05-1120'
    // TODO: Fix this issue with Date type
    // customerToAdd.dob = new Date('2023-03-21')
    customerToAdd.state = 'IL'

    const addedCustomer = await customerToAdd.save();

    console.log(addedCustomer)

    const customer = await Customer.findOneBy({
      id: addedCustomer.id
    })
    console.log(addedCustomer);

  })
});
