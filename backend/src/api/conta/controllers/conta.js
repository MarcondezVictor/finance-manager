'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::conta.conta', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Sanitizamos ANTES de metermos o `owner`, porque o sanitizeQuery/validateQuery
    // rejeita qualquer filtro sobre uma relação (aqui, para o User) se o papel
    // autenticado não tiver permissão "find" nesse content-type — e não queremos
    // dar essa permissão (exporia /api/users a todos os utilizadores).
    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const { results, pagination } = await strapi.service('api::conta.conta').find({
      ...sanitizedQuery,
      filters: { $and: [sanitizedQuery.filters || {}, { owner: user.id }] },
    });

    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::conta.conta').findOne({
      documentId: ctx.params.id,
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Esta conta não é tua.');
    }
    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const { body = {} } = ctx.request;
    if (!body.data) {
      return ctx.badRequest('Falta o payload "data" no corpo do pedido.');
    }

    // Mesmo motivo do find(): validamos/sanitizamos o payload do cliente antes
    // de acrescentar o `owner`, para não disparar a validação de relações do User.
    await this.validateInput(body.data, ctx);
    const sanitizedInputData = await this.sanitizeInput(body.data, ctx);

    const entity = await strapi.service('api::conta.conta').create({
      ...sanitizedQuery,
      data: { ...sanitizedInputData, owner: user.id },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitizedEntity);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::conta.conta').findOne({
      documentId: ctx.params.id,
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Esta conta não é tua.');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::conta.conta').findOne({
      documentId: ctx.params.id,
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Esta conta não é tua.');
    }
    return super.delete(ctx);
  },
}));