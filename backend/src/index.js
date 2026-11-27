'use strict';

// Content types that logged-in users manage. Ownership is enforced in each
// controller (see src/utils/owned-controller.js), so it's safe to grant full CRUD.
const OWNED_CONTENT_TYPES = ['api::account.account', 'api::transaction.transaction', 'api::tag.tag'];
const ACTIONS = ['find', 'findOne', 'create', 'update', 'delete'];

module.exports = {
  register(/* { strapi } */) {},

  /**
   * On startup, make sure the "Authenticated" role can use the app's API.
   * This replaces the manual step of ticking checkboxes in the admin panel.
   */
  async bootstrap({ strapi }) {
    const role = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });
    if (!role) return;

    const permissions = strapi.db.query('plugin::users-permissions.permission');

    for (const uid of OWNED_CONTENT_TYPES) {
      for (const action of ACTIONS) {
        const name = `${uid}.${action}`;
        const existing = await permissions.findOne({ where: { action: name, role: role.id } });
        if (!existing) {
          await permissions.create({ data: { action: name, role: role.id } });
        }
      }
    }
  },
};
