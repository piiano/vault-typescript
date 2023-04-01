import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Customer } from "./entity/Customer";


describe('orm',  function () {

  it('should be able to encrypt and decrypt data using typeorm-encryption', async function () {

    const dataSource = await AppDataSource.initialize();
    const customerRepository = dataSource.getRepository(Customer);

    const customer: Customer = new Customer();

    customer.name = 'John'
    customer.email = 'JohnA@gmail.com'
    customer.phone = '+972-54-1234567'
    customer.ssn = '078-05-1120'
    customer.dob = new Date('2023-03-21')
    customer.state = 'IL'

    await customer.save()



    // const dataSource = await AppDataSource.initialize();
    // const userRepository = dataSource.getRepository(User);
    //
    // // Create a new user
    // const user = userRepository.create({
    //
    // });
    // await userRepository.save(user);
    //
    // // Get all users
    // const users = await userRepository.find();
    //
    // // Get a user by ID
    // const user = await userRepository.findOne({
    //   where: {
    //     id: Number('1'),
    //   },
    // });
    //
    // // Update a user by ID
    // const user = await userRepository.findOne({
    //   where: {
    //     id: Number('1'),
    //   },
    // });
    // userRepository.merge(user, {});
    // await userRepository.save(user);
    //
    // // Delete a user by ID
    // const user = await userRepository.findOne({
    //   where: {
    //     id: Number(req.params.id),
    //   },
    // });
    // await userRepository.remove(user);
  })
});
