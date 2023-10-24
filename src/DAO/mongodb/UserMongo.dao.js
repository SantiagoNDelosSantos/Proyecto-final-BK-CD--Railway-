import mongoose from "mongoose";
import {
    userModel
} from './models/users.model.js'
import {
    envMongoURL
} from "../../config.js";

export default class UserDAO {
    connection = mongoose.connect(envMongoURL);
    async getUser(uid) {
        let response = {};
        try {
            const result = await userModel.findOne({
                _id: uid
            });
            if (result === null) {
                response.status = "not found user";
            } else {
                response.status = "success";
                response.result = result;
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al obtener la session - DAO: " + error.message;
        };
        return response;
    };
    async updateUser(uid, updateUser) {
        let response = {};
        try {
            let result = await userModel.updateOne({
                _id: uid
            }, {
                $set: updateUser
            });
            if (result.matchedCount === 0) {
                response.status = "not found user";
            } else if (result.matchedCount === 1) {
                let userUpdate = await userModel.findOne({
                    _id: uid
                });
                response.status = "success";
                response.result = userUpdate;
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al actualizar los datos de usuario - DAO: " + error.message;
        };
        return response;
    };
    async uploadPremiumDocs(uid, documentsRuta, documentNames) {
        let response = {};
        try {
            const user = await userModel.findOne({
                _id: uid
            });
            if (user === null) {
                response.status = "not found user";
            } else {
                for (let i = 0; i < documentsRuta.length; i++) {
                    const ruta = documentsRuta[i];
                    const name = documentNames[i];
                    if (ruta !== undefined) {
                        const existingDocument = user.documents.find(doc => doc.name === name);
                        if (existingDocument) {
                            existingDocument.reference = ruta;
                        } else {
                            user.documents.push({
                                name: name,
                                reference: ruta
                            });
                        }
                    }
                }
                await user.save();
                const docsSubidos = user.documents.map(doc => doc.name);
                let docsPendientes = [];
                for (const documentName of documentNames) {
                    if (!docsSubidos.includes(documentName)) {
                        docsPendientes.push(documentName);
                    }
                }
                if (docsSubidos.length === 3) {
                    response.status = "success";
                    response.result = `${docsSubidos.join(', ')}`;
                } else {
                    response.status = "parcial success";
                    response.result1 = `${docsSubidos.join(', ')}`;
                    response.result2 = `${docsPendientes.join(', ')}`;
                }
            }
        } catch (error) {
            response.status = "error";
            response.message = "Error al actualizar los datos de usuario - DAO: " + error.message;
        };
        return response;
    };
    async getAllUsers() {
        let response = {};
        try {
            const users = await userModel.find({}, 'first_name email role last_connection _id' ).exec();
            if (users.length === 0) {
                response.status = "not found users";
            } else {
                response.status = "success";
                response.result = users;
            }
        } catch (error) {
            response.status = "error";
            response.message = "Error al obtener los usuarios - DAO: " + error.message;
        };
        return response;
    };
    async deleteInactivityUsers() {
        let response = {};
        try {
            // Calcular la fecha (Dias):
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 2);
            // Milisegundos para puruebas:
            // cutoffDate.setMinutes(cutoffDate.getMilliseconds() - 10);
            const cutoffDateString = `${cutoffDate.toLocaleDateString()} - ${cutoffDate.toLocaleTimeString()}`;
            const inactiveUsers = await userModel.find({
                last_connection: {
                    $lt: cutoffDateString
                }
            }).exec();
            if (inactiveUsers.length > 0) {
                const deletedUser = [];
                response.status = "success";
                response.result = deletedUser;
                for (const user of inactiveUsers) {
                    deletedUser.push([
                        user.first_name, 
                        user.email, 
                        user._id, 
                        user.cart, 
                        user.role
                    ]);
                    await userModel.findByIdAndRemove(user._id);
                };
            } else {
                response.status = "not found inactivity users";
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al eliminar usuarios inactivos - DAO: " + error.message;
        };
        return response;
    };
};