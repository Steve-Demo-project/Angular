import { MESSAGES } from '../config/messages';
import { STATUS } from '../config/statuscodes';
import { ShippingMethodInstance } from '../models/ServiceShippingMethod';

export class ServiceMethodController {
  public getServiceMethods(db) {
    return new Promise((resolve, reject) => {
      db.ShippingMethod.findAll({})
        .then((serviceCarrier: ShippingMethodInstance) => {
          resolve({
            message: MESSAGES.USER_GET_SUCCESS,
            serviceCarrier,
            status: STATUS.SUCCESS,
            success: true,
          });
        })
        .catch(err => {
          console.log(err);
          reject({
            error: true,
            message: [MESSAGES.USER_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }
}
