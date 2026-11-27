'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::movimento.movimento', ({ strapi }) => ({
  // LISTAR — só os movimentos do utilizador autenticado
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Sanitizamos ANTES de metermos o `owner`, porque o sanitizeQuery/validateQuery
    // rejeita qualquer filtro sobre uma relação (aqui, para o User) se o papel
    // autenticado não tiver permissão "find" nesse content-type — e não queremos
    // dar essa permissão (exporia /api/users a todos os utilizadores).
    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const { results, pagination } = await strapi.service('api::movimento.movimento').find({
      ...sanitizedQuery,
      filters: { $and: [sanitizedQuery.filters || {}, { owner: user.id }] },
    });

    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // OBTER UM — confirma que é do utilizador
  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::movimento.movimento').findOne({
      documentId: ctx.params.id, // no Strapi 5 o :id da rota é o documentId
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Este movimento não é teu.');
    }
    return super.findOne(ctx);
  },

  // CRIAR — define automaticamente o dono
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

    const entity = await strapi.service('api::movimento.movimento').create({
      ...sanitizedQuery,
      data: { ...sanitizedInputData, owner: user.id },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitizedEntity);
  },

  // ATUALIZAR — só se for teu
  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::movimento.movimento').findOne({
      documentId: ctx.params.id,
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Este movimento não é teu.');
    }
    return super.update(ctx);
  },

  // APAGAR — só se for teu
  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const registo = await strapi.documents('api::movimento.movimento').findOne({
      documentId: ctx.params.id,
      populate: ['owner'],
    });
    if (!registo || registo.owner?.id !== user.id) {
      return ctx.forbidden('Este movimento não é teu.');
    }
    return super.delete(ctx);
  },
}));