'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * Core controller for a content type whose records belong to a single user.
 *
 * - find:    returns only the logged-in user's records
 * - create:  sets the owner from the JWT (the client can't choose it)
 * - findOne, update, delete: only allowed on the user's own records
 *
 * @param {string} uid   Content-type UID, e.g. 'api::account.account'
 * @param {string} label Human-readable name used in error messages, e.g. 'account'
 */
module.exports = function createOwnedController(uid, label) {
  return createCoreController(uid, ({ strapi }) => {
    async function assertOwner(ctx) {
      const record = await strapi.documents(uid).findOne({
        documentId: ctx.params.id, // in Strapi 5 the route :id is the documentId
        populate: ['owner'],
      });
      if (!record || record.owner?.id !== ctx.state.user.id) {
        ctx.forbidden(`This ${label} does not belong to you.`);
        return false;
      }
      return true;
    }

    return {
      async find(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        // Validate/sanitize the client query BEFORE adding the owner filter:
        // sanitizeQuery rejects filters on the User relation unless the role can
        // `find` users, and we don't want to grant that (it would expose /api/users).
        await this.validateQuery(ctx);
        const sanitizedQuery = await this.sanitizeQuery(ctx);

        const { results, pagination } = await strapi.service(uid).find({
          ...sanitizedQuery,
          filters: { $and: [sanitizedQuery.filters || {}, { owner: user.id }] },
        });

        const sanitizedResults = await this.sanitizeOutput(results, ctx);
        return this.transformResponse(sanitizedResults, { pagination });
      },

      async findOne(ctx) {
        if (!ctx.state.user) return ctx.unauthorized();
        if (!(await assertOwner(ctx))) return;
        return super.findOne(ctx);
      },

      async create(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        await this.validateQuery(ctx);
        const sanitizedQuery = await this.sanitizeQuery(ctx);

        const { body = {} } = ctx.request;
        if (!body.data) {
          return ctx.badRequest('Missing "data" payload in the request body.');
        }

        // Same reason as in find(): validate the client payload before adding `owner`.
        await this.validateInput(body.data, ctx);
        const sanitizedInputData = await this.sanitizeInput(body.data, ctx);

        const entity = await strapi.service(uid).create({
          ...sanitizedQuery,
          data: { ...sanitizedInputData, owner: user.id },
        });

        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        ctx.status = 201;
        return this.transformResponse(sanitizedEntity);
      },

      async update(ctx) {
        if (!ctx.state.user) return ctx.unauthorized();
        if (!(await assertOwner(ctx))) return;
        return super.update(ctx);
      },

      async delete(ctx) {
        if (!ctx.state.user) return ctx.unauthorized();
        if (!(await assertOwner(ctx))) return;
        return super.delete(ctx);
      },
    };
  });
};
