<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.piiano.com/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://docs.piiano.com/img/logo-developers.svg">
      <img alt="Piiano Vault" src="https://docs.piiano.com/img/logo-developers.svg" height="40" />
    </picture>
  </a>
</p>

# Piiano vault Typescript SDK

This folder contains SDKs that connect to the Vault.

1. [Vault Client](./vault-client) - client to connect to the Vault
1. [Vault Encryption with TypeORM](./typeorm-encryption) - SDK to automatically encrypt/decrypt the TypeORM fields
2. [Vault PCI Forms](./forms) - processes sensitive data without exposing it to your systems by automatically tokenizing it before submitting it to your backend. Typical use case is for processing credit card numbers and still remaining outside of a PCI scope


