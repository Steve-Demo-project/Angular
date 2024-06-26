import * as fs from 'fs';
import * as moment from 'moment';
import * as config from '../config/config';
import { MESSAGES } from '../config/messages';
import { STATUS } from '../config/statuscodes';
import { AccountStatusInstance } from '../models/AccountStatus';
import { BoxNumberInstance } from '../models/BoxNumber';
import { UserInstance } from '../models/User';
import { UserNotesInstance } from '../models/UserNotes';
import { HttpService } from '../services/http-service';
import { DbInterface } from '../typings/DbInterface';

export class ItemCheckerController {
  public getUserDetailsByBoxNumber(boxNumber, db: DbInterface) {
    return new Promise((resolve, reject) => {
      db.BoxNumbers.findOne({ where: { box_number: boxNumber } })
        .then((boxData: BoxNumberInstance) => {
          if (boxData) {
            const response: any = {};
            const userObjectArray: any = [];
            const userObject: any = {};
            if (boxData.user_id) {
              response.box = boxData.box_number;
              db.User.findById(boxData.user_id as any)
                .then(async (userData: UserInstance) => {
                  userObject.name = userData.name;
                  // set user type to primary as of now
                  userObject.type = 'PRIMARY';
                  try {
                    // get notes for the user by user id
                    const userNotes: UserNotesInstance[] = await db.UserNotes.findAll({
                      where: {
                        user_id: boxData.user_id,
                      },
                    });
                    userObject.notes = userNotes.length > 0 ? userNotes[0].note : '';
                    // get account status based on user id
                    const accountStatus: AccountStatusInstance = await db.AccountStatus.findOne({
                      where: {
                        user_id: boxData.user_id,
                      },
                    });
                    userObject.status = accountStatus ? accountStatus.event_status : '';
                    userObjectArray.push(userObject);
                    response.customer_names = userObjectArray;
                    response.email = userData.email;
                    response.errors = [];
                    response.id = userData.id;
                    response.inventory = false;
                    response.name = userData.name;
                    response.notes = userObject.notes;
                    // get default address by user
                    const addressData: any = await db.Address.findOne({
                      where: { user_id: boxData.user_id, is_default: true },
                    });
                    if (addressData) {
                      response.primary_address = {
                        id: addressData.id,
                        contact_name: addressData.name,
                        street_lines: addressData.address_line,
                        city: addressData.city,
                        country: addressData.country,
                        phone_number: addressData.phone_number,
                        postal_code: addressData.postal_code,
                        residential: false,
                        subdivision: '',
                        verified: false,
                        customer: 1,
                      };
                    }
                    response.relocator = null;
                    // two years added to created date
                    const reservedThroughdate = moment(boxData.createdAt)
                      .add(2, 'y')
                      .format('YYYY-MM-DD');
                    response.reserved_through = reservedThroughdate;
                    response.signed_up = moment(boxData.createdAt).format('YYYY-MM-DD');
                    response.status = 'Approved & Active';
                    response.success = true;
                    resolve(response);
                  } catch (err) {
                    reject({
                      error: true,
                      message: [MESSAGES.EXECUTE_GET_ERROR, err],
                      status: STATUS.INTERNAL_SERVER_ERROR,
                    });
                  }
                })
                .catch(err => {
                  reject({
                    error: true,
                    message: [MESSAGES.USER_GET_ERROR, err],
                    status: STATUS.INTERNAL_SERVER_ERROR,
                  });
                });
            }
          } else {
            reject({
              errors: [MESSAGES.INVALID_BOX_NUMBER],
              success: false,
              status: STATUS.NOT_FOUND,
            });
          }
        })
        .catch(err => {
          reject({
            error: true,
            message: [MESSAGES.BOX_INFO_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }

  public delegateToMailsApp(req, token, fileObject, extension) {
    return new Promise(async (resolve, reject) => {
      const httpService: HttpService = new HttpService();
      if (!config.usgmMailUrl) {
        return reject({
          message: MESSAGES.NO_MAILS_URL_EXIST_IN_ENV_VARIABLES,
        });
      }
      const formData = {
        ...req.body,
        originalExtension: extension,
      };
      if (fileObject) {
        formData.picture = fs.createReadStream(fileObject.path);
      }
      const options: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-token': token,
        },
        url: config.usgmMailUrl + '/warehouse/admin/item/add',
        formData,
      };
      console.log('options', options);
      httpService.http_post_with_options(options).then(
        (response: any) => {
          resolve(response);
        },
        (error: any) => {
          if (error) {
            reject(error);
          }
        }
      );
    });
  }

  public deletegateRequestToMailsApp(req, token) {
    return new Promise(async (resolve, reject) => {
      const httpService: HttpService = new HttpService();
      if (!config.usgmMailUrl) {
        return reject({
          message: MESSAGES.NO_MAILS_URL_EXIST_IN_ENV_VARIABLES,
        });
      }
      const options: any = {
        method: req.method,
        headers: {
          'x-access-token': token,
        },
        url: config.usgmMailUrl + req.url,
      };
      if (req.method === 'POST') {
        options.form = req.body;
      }
      console.log('options', options);
      if (req.method === 'POST') {
        httpService.http_post_with_options(options).then(
          (response: any) => {
            resolve(response);
          },
          (error: any) => {
            if (error) {
              reject(error);
            }
          }
        );
      } else {
        httpService.http_get_with_options(options).then(
          (response: any) => {
            resolve(response);
          },
          (error: any) => {
            if (error) {
              reject(error);
            }
          }
        );
      }
    });
  }
}
