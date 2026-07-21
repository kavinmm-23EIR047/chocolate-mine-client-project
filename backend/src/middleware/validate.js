const Joi = require('joi');
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map(el => el.message).join(', ');
    return next(new AppError(message, 400));
  }
  next();
};

const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.'
    })
});

// Flavour schema for cake products
const flavourSchema = Joi.object({
  name: Joi.string().required(),
  customName: Joi.string().allow(''),
  weightOptions: Joi.array().items(Joi.string()).min(1).required(),
  images: Joi.array().items(Joi.string())
});

const productSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().required(),
  price: Joi.number().min(0).required(),
  offerPrice: Joi.number().min(0),
  stock: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0)).required(),
  description: Joi.string().required(),
  shortDescription: Joi.string().required(),
  image: Joi.string().required(),
  location: Joi.string().valid('coimbatore', 'chennai', 'bangalore', 'hyderabad'),
  occasion: Joi.array().items(Joi.string()),
  featured: Joi.boolean(),
  bestseller: Joi.boolean(),
  isActive: Joi.boolean(),
  flavours: Joi.when('category', {
    is: 'cakes',
    then: Joi.array().items(flavourSchema).min(1).required().messages({
      'array.min': 'At least one flavour is required for cake products'
    }),
    otherwise: Joi.forbidden()
  }),
  coupon: Joi.object({
    enabled: Joi.boolean(),
    code: Joi.string().when('enabled', { is: true, then: Joi.required() }),
    type: Joi.string().valid('flat', 'price', 'percent'),
    value: Joi.number().min(0).when('enabled', { is: true, then: Joi.required() })
  }).custom((value, helpers) => {
    if (value.enabled && value.type === 'price' && value.value >= helpers.state.ancestors[0].price) {
      return helpers.message('Coupon price must be less than original price');
    }
    if (value.enabled && value.type === 'percent' && value.value > 100) {
      return helpers.message('Percent discount cannot exceed 100%');
    }
    return value;
  })
}).unknown(true);

const customCakeSchema = Joi.object({
  shape: Joi.string().valid('circle', 'square').required(),
  tiers: Joi.number().min(1).max(5).required(),
  weight: Joi.string().required(),
  flavour: Joi.string().required(),
  messageOnCake: Joi.string().max(40),
  deliveryDate: Joi.date().greater('now').required(),
  deliverySlot: Joi.string().required()
}).unknown(true);

module.exports = {
  validate,
  signupSchema,
  productSchema,
  customCakeSchema
};