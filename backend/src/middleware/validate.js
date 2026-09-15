const Joi = require('joi');
const AppError = require('../utils/AppError');

const formatFieldLabel = (field) => {
  const labels = {
    name: 'Name',
    email: 'Email',
    password: 'Password',
    phone: 'Phone number',
    otp: 'OTP',
    confirmPassword: 'Confirm password',
    price: 'Price',
    category: 'Category',
    description: 'Description',
    shortDescription: 'Short description',
    image: 'Image',
    stock: 'Stock',
    flavour: 'Flavour',
    weight: 'Weight',
    deliveryDate: 'Delivery date',
    deliverySlot: 'Delivery slot'
  };
  return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
};

const formatJoiDetail = (detail) => {
  const field = detail.path.join('.') || 'general';
  const type = detail.type;
  const label = formatFieldLabel(detail.path[detail.path.length - 1] || field);

  // If Joi rule has a tailored custom message provided in schema, prioritize it
  if (detail.message && !detail.message.includes('fails to match') && !detail.message.includes('must be one of')) {
    const cleanMsg = detail.message.replace(/['"]/g, '');
    if (!cleanMsg.startsWith(detail.path.join('.'))) {
      return { field, message: cleanMsg };
    }
  }

  // Fallback friendly formatting
  if (type === 'string.empty' || type === 'any.required') {
    return { field, message: `${label} is required.` };
  }
  if (type === 'string.email') {
    return { field, message: 'Please enter a valid email address.' };
  }
  if (type === 'string.min') {
    return { field, message: `${label} must be at least ${detail.context?.limit} characters.` };
  }
  if (type === 'string.max') {
    return { field, message: `${label} cannot exceed ${detail.context?.limit} characters.` };
  }
  if (type === 'number.min') {
    return { field, message: `${label} must be at least ${detail.context?.limit}.` };
  }
  if (type === 'number.base') {
    return { field, message: `${label} must be a valid number.` };
  }

  const cleanMessage = detail.message.replace(/['"]/g, '').replace(`${detail.path.join('.')}`, label);
  return { field, message: cleanMessage };
};

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map(formatJoiDetail);
    
    let primaryMessage = 'Please complete the required fields.';
    if (errorDetails.length === 1) {
      primaryMessage = errorDetails[0].message;
    } else {
      primaryMessage = 'Please correct the highlighted fields.';
    }

    return next(new AppError(primaryMessage, 400, 'VALIDATION_ERROR', errorDetails));
  }
  req.body = value;
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