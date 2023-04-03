import {User} from "../src/entity/User";
import {Repository} from "typeorm";
import {before, describe} from "mocha";
import {expect} from "chai";

describe("collections", function () {
  let userRepository: Repository<User>;

  before(async function () {
    userRepository = this.dataSource.getRepository(User);
  });

  afterEach(async function () {
    // clear the database after each test
    await userRepository.clear();
  });

  it("demonstration", async function () {
    console.log("Adding users");
    console.log(
      "Adding user john with email john@exmaple.com and with phone 123-11111"
    );
    await userRepository.save({
      name: "john",
      email: "john@exmaple.com",
      phone: "123-11111",
      ssn: "123-11-1111",
      dob: "1990-01-01",
      state: "CA",
    });

    console.log(
      "Adding user john with email john2@exmaple.com and with phone 123-22222"
    );
    await userRepository.save({
      name: "john",
      email: "john2@exmaple.com",
      phone: "123-22222",
      ssn: "123-11-2222",
      dob: "1992-12-02",
      state: "CA",
    });

    console.log(
      "Adding user john with email alice@exmaple.com and with phone 123-33333"
    );
    await userRepository.save({
      name: "alice",
      email: "alice@exmaple.com",
      phone: "123-33333",
      ssn: "123-11-3333",
      dob: "1993-03-03",
      state: "CA",
    });

    console.log(
      "Adding user john with email bob@exmaple.com and with phone 123-44444"
    );
    await userRepository.save({
      name: "bob",
      email: "bob@exmaple.com",
      phone: "123-4444",
      ssn: "123-11-4444",
      dob: "1994-04-04",
      state: "MA",
    });

    console.log("Get all customers --> Expecting 4 results");
    const allUsers = await userRepository.find();
    expect(allUsers.length).to.equal(4);
    console.log(allUsers);

    console.log(
      "Showing encrypted data in db (note all columns are encrypted except the 'state' columns)"
    );
    console.log(await this.dataSource.query("SELECT * FROM user"));
  });
});
