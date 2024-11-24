import type { VaultFunction } from "@piiano/vault-bundles";

export const send_welcome_email: VaultFunction = {
  type: "action",
  description: "Send welcome email to user",
  async handler({ body, vault }) {
    // Validate the body input
    if (
      body === null ||
      typeof body !== "object" ||
      !("user_id" in body) ||
      typeof body.user_id !== "string"
    ) {
      return { ok: false, message: "Invalid input" };
    }

    // Fetch the user object from the users collection.
    const { user } = (await vault.deref({
      user: `pvlt:read_object:users::${body.user_id}:`,
    })) as { user: { name: string; email: string } };

    // Send API call to email service with the user's email address and user name in the body.
    const response = await fetch(
      "http://host.docker.internal:3000/api/send-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          subject: "Welcome",
          body: `Hi ${user.name} 👋,
Welcome to our platform!
We're excited to have you on board.
Thanks,
The Team`,
        }),
      },
    );

    // Validate the response
    if (!response.ok) {
      return { ok: false, message: "Failed to send email" };
    }

    // Parse the response as JSON
    const result = (await response.json()) as { sent: boolean };

    // Return a success response
    return { ok: true, sent: result.sent };
  },
};
