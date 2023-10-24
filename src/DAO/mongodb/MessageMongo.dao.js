import mongoose from "mongoose";
import {
    messageModel
} from "./models/messages.model.js";
import {
    envMongoURL
} from "../../config.js";

// Clase para el DAO de mensajes: 
export default class MessageDAO {

    // Conexión Mongoose:
    connection = mongoose.connect(envMongoURL);

    // Crear un mensaje - DAO:
    async createMessage(message) {
        let response = {};
        try {
            const result = await messageModel.create(message);
            response.status = "success";
        } catch (error) {
            response.status = "error";
            response.message = "Error al crear el mensaje - DAO: " + error.message;
        };
        return response;
    };

    // Traer todos los mensajes - DAO: 
    async getAllMessage() {
        let response = {};
        try {
            let result = await messageModel.find().lean();
            if (result.length === 0) {
                response.status = "not found messages";
                response.result = result;
            } else {
                response.status = "success";
                response.result = result;
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al obtener los mensajes - DAO: " + error.message;
        };
        return response;
    };

    // Borrar un mensaje - DAO:
    async deleteMessage(mid, uid) {
        let response = {};
        try {
            let getSms = await messageModel.findOne({
                _id: mid
            });
            // Extraemos el uid de la persona que envio el mensaje:
            let UID = getSms.userId;
            // Comparamos si el uid de quien intenta borrar el mensaje, conincide con el uid de quien lo envio:
            if (uid === UID) {
                // Si la persona solo quiere borrar sus propios mensajes, se le permite la acción:
                let result = await messageModel.deleteOne({
                    _id: mid
                });
                if (result.deletedCount === 0) {
                    response.status = "not found message";
                } else if (result.deletedCount === 1) {
                    response.status = "success";
                };
            } else {
                // Si la persona intenta borrar un mensaje que no le pertenece, se le deniega la acción:
                response.status = "unauthorized";
            }
        } catch (error) {
            response.status = "error";
            response.message = "Error al eliminar el mensaje - DAO: " + error.message;
        };
        return response;
    };

};