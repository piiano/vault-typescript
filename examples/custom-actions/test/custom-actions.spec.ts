import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {expect} from "chai";

describe('custom actions', function () {
  it('create bundle and custom action and use it', async function () {
    const bundleCode = await readFile(resolve(__dirname, '../dist/index.js'));
    const bundle = await this.vaultClient.bundles.addBundle({
      requestBody: {
        name: 'emails',
        description: 'Functions for sending emails',
        code: bundleCode.toString('base64')
      }
    })

    expect(bundle.exports?.actions).to.have.length(1);
    expect(bundle.exports?.actions?.[0]?.name).to.equal('send_welcome_email');
    expect(bundle.exports?.actions?.[0]?.type).to.equal('action');

    await this.vaultClient.actions.addAction({
      requestBody: {
        name: 'send_welcome_email',
        function: 'emails.send_welcome_email',
        description: 'Send welcome email to user',
        role: 'VaultAdminRole' // used as example only. In production, use a role with the minimum required permissions for the action.
      }
    })

    await this.vaultClient.collections.addCollection({
      requestBody: {
        name: "users",
        type: "PERSONS",
        properties: [
          { name: "name", data_type_name: "NAME" },
          { name: "email", data_type_name: "EMAIL" },
        ]
      }
    });

    const testUser = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const { id } = await this.vaultClient.objects.addObject({
      collection: 'users',
      reason: 'AppFunctionality',
      requestBody: testUser,
    });
    expect(id).to.be.a('string');

    // Read SSN with and without transformations
    const result = await this.vaultClient.actions.invokeAction({
      action: 'send_welcome_email',
      reason: 'AppFunctionality',
      requestBody: { user_id: id },
    });

    expect(result).to.deep.equal({ ok: true, sent: true });
  });
});
