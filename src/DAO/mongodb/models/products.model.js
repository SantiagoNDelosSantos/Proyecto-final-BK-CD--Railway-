import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2'

const collection = 'products';

const ProductsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    imgFront: {
        name: {
            type: String,
            required: true
        },
        reference: {
            type: String,
            required: true
        },
    },
    imgBack: {
        name: {
            type: String,
            required: true
        },
        reference: {
            type: String,
            required: true
        },
    },
    owner: {
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },
    email: {
        type: String
    },
})

ProductsSchema.plugin(mongoosePaginate)

export const productsModel = mongoose.model(collection, ProductsSchema)