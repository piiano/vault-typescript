import { TestDataSource } from "../src/data-source";
import { User } from "../src/entity/User";
import { DataSource, Repository } from "typeorm";
import { after, before, describe } from "mocha";
import { expect, use } from "chai";

describe("collections", function () {
  let dataSource: DataSource;
  let userRepository: Repository<User>;

  before(async () => {
    dataSource = await TestDataSource.initialize();
    userRepository = TestDataSource.getRepository(User);

    await userRepository.clear();
  });

  after(async () => {
    await dataSource.destroy();
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

    console.log("Search customer by name=john --> expecting 2 results");
    const johnUsers = await userRepository.findBy({ name: "john" });
    expect(johnUsers.length).to.equal(2);
    console.log(johnUsers);

    console.log("Get all customers --> Expecting 4 results");
    const allUsers = await userRepository.find();
    expect(allUsers.length).to.equal(4);
    console.log(allUsers);

    console.log(
      "Showing encrypted data in db (note all columns are encrypted except the 'state' columns)"
    );
    console.log(await dataSource.query("SELECT * FROM user"));
  });
});
