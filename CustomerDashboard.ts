import { MESSAGES } from '../config/messages';
import { STATUS } from '../config/statuscodes';
import { AccountStatus, DashboardBoxes } from '../models/AccountStatus';
export class CustomerController {
  public dashboardBoxes;
  private rowsPerPage: number = 10;
  public getStatsForDashboard(db) {
    return new Promise((resolve, reject) => {
      db.User.findAll()
        .then(async (users: any) => {
          const statuses = [];
          const waitingForRecovation = [];
          const statuesData: any = await db.AccountStatus.findAll();
          const pendingToActivation = [];
          for (let o = 0; o <= users.length - 1; o++) {
            const status = await db.AccountStatus.findOne({
              where: { user_id: users[o].id },
              order: [['created_at', 'DESC']],
            });
            if (status) {
              statuses.push(status);
            }
            const addedPrimaryName = statuesData.find(
              p => p.user_id === users[o].id && p.event_status === AccountStatus.ADD_PRIMARY_NAME
            );
            const addedAddress = statuesData.find(
              p => p.user_id === users[o].id && p.event_status === AccountStatus.ADDED_ADDRESS
            );
            const verifyDocumentPrimary = statuesData.find(
              p =>
                p.user_id === users[o].id &&
                p.event_status === AccountStatus.VERIFY_DOCUMENT_PRIMARY
            );
            const verifyDocumentSecondary = statuesData.find(
              p =>
                p.user_id === users[o].id &&
                p.event_status === AccountStatus.VERIFY_DOCUMENT_SECONDARY
            );
            const notry = statuesData.find(
              p =>
                p.user_id === users[o].id && p.event_status === AccountStatus.VERIFY_NOTARY_PRIMARY
            );
            const verifyForm = statuesData.find(
              p =>
                p.user_id === users[o].id &&
                p.event_status === AccountStatus.VERIFY_FORM_1583_PRIMARY
            );
            const isApprovedOrSuspendedOrClose = statuesData.find(
              p =>
                p.user_id === users[o].id &&
                (p.event_status === AccountStatus.APPROVED ||
                  p.event_status === AccountStatus.SUSPENDED ||
                  p.event_status === AccountStatus.CLOSE)
            );
            if (
              addedPrimaryName &&
              addedAddress &&
              verifyDocumentPrimary &&
              verifyDocumentSecondary &&
              notry &&
              verifyForm &&
              !isApprovedOrSuspendedOrClose
            ) {
              pendingToActivation.push(users[o]);
            }
          }
          const suspendedStatus = statuses.filter(x => x.event_status === AccountStatus.SUSPENDED);

          if (suspendedStatus && suspendedStatus.length > 0) {
            for (let i = 0; i <= suspendedStatus.length - 1; i++) {
              const suspendedDateAfter180days = new Date(
                suspendedStatus[i].createdAt.setDate(suspendedStatus[i].createdAt.getDate() + 180)
              );
              const currentDate = new Date();
              if (currentDate > suspendedDateAfter180days) {
                const boxNumber = await db.BoxNumbers.findOne({
                  where: { user_id: suspendedStatus[i].user_id },
                });
                if (boxNumber) {
                  waitingForRecovation.push(boxNumber);
                }
              }
            }
          }
          const statsData = this.getStatsData(statuses, waitingForRecovation, pendingToActivation);
          resolve({
            message: MESSAGES.DASHBOARD_STATS_GET_SUCCESS,
            stats: statsData,
            status: STATUS.SUCCESS,
            success: true,
          });
        })
        .catch(err => {
          reject({
            error: true,
            message: [MESSAGES.DASHBOARD_STATS_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }

  public getStatsData(res, waitingForRecovation, pendingToActivation) {
    const waitingForFormApprovel = res.filter(
      p =>
        p.event_status === AccountStatus.ADDED_FORM_1583_PRIMARY ||
        p.event_status === AccountStatus.ADDED_FORM_1583_SECONDARY
    );
    const waitingForIdApprovel = res.filter(
      p =>
        p.event_status === AccountStatus.ADD_DOCUMENT_SECONDARY ||
        p.event_status === AccountStatus.ADD_DOCUMENT_PRIMARY
    );
    const waitingForChangeOfAddress = res.filter(
      p => p.event_status === AccountStatus.ADDED_ADDRESS
    );
    const data = {
      pendingToActivation: pendingToActivation.length,
      WaitingForFormApprovel: waitingForFormApprovel.length,
      WaitingForIdApprovel: waitingForIdApprovel.length,
      WaitingForChangeOfAddress: waitingForChangeOfAddress.length,
      WaitingForRecovation: waitingForRecovation.length,
    };

    return data;
  }

  public getBreakdownOfAssignments(db, params) {
    const page: number = params.page || 0;
    return new Promise((resolve, reject) => {
      db.Plan.findAll({
        attributes: [
          'id',
          'name',
          'features',
          'is_public',
          'business',
          'family',
          'relocator_plan',
          'max_names',
          'terms',
          'scan_credits',
          'consolidation_credits',
          'shipping_credits',
          'inbox',
          'letters_only',
          'create_requests',
          'modify_requests',
          'inventory',
          'change_schedule',
          'is_deprecated',
          'created_at',
          'updated_at',
          'deleted_at',
        ],
      })
        .then(async (plans: any) => {
          const data = [];
          for (let i = 0; i <= plans.length - 1; i++) {
            const userPlans = await db.UserPlans.findAll({
              where: { plan_id: plans[i].id },
            });
            const userPlan = {
              id: plans[i].id,
              name: plans[i].name,
              termPrice: plans[i].terms ? plans[i].terms[0].term_price : null,
              termName: plans[i].terms ? plans[i].terms[0].chargebeeId : null,
              termPeriod: plans[i].terms ? plans[i].terms[0].term_period + ' months' : null,
              customerCount: userPlans.length,
            };
            data.push(userPlan);
          }
          const arrayList = [];
          const filterData = data.slice(this.rowsPerPage * page);
          for (let i = 0; i <= filterData.length - 1; i++) {
            arrayList.push(filterData[i]);
            if (i === this.rowsPerPage - 1) {
              break;
            }
          }
          resolve({
            message: MESSAGES.BREAKDOWN_OF_ASSIGNMENTS_GET_SUCCESS,
            status: STATUS.SUCCESS,
            breakdownAssignments: arrayList,
            total_count: data.length,
            success: true,
          });
        })
        .catch(err => {
          reject({
            error: true,
            message: [MESSAGES.BREAKDOWN_OF_ASSIGNMENTS_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }

  public getCustomerStatuses(db, sqlDb = null) {
    return new Promise((resolve, reject) => {
      db.User.findAll()
        .then(async (users: any) => {
          const statuses = [];
          for (let o = 0; o <= users.length - 1; o++) {
            const userStatus = await db.AccountStatus.findOne({
              where: { user_id: users[o].id },
              order: [['id', 'DESC']],
            });
            if (userStatus) {
              statuses.push(userStatus);
            }
          }
          let status = [];
          if (sqlDb) {
            status = await sqlDb.query(
              'SELECT unnest(enum_range(NULL::enum_account_status_event_status)) as status',
              {
                type: sqlDb.QueryTypes.SELECT,
              }
            );
          }
          const filterStatusCountList = [];
          for (let o = 0; o <= status.length - 1; o++) {
            const filterStatus = statuses.filter(p => p.event_status === status[o].status);
            const data = {
              name: status[o].status,
              count: filterStatus.length,
            };
            filterStatusCountList.push(data);
          }
          resolve({
            message: MESSAGES.CUSTOMER_STATUS_GET_SUCCESS,
            status: STATUS.SUCCESS,
            filterStatusCountData: filterStatusCountList,
            success: true,
          });
        })
        .catch(err => {
          reject({
            error: true,
            message: [MESSAGES.CUSTOMER_STATUS_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }

  public getDashboardBoxesStats(db) {
    this.dashboardBoxes = new DashboardBoxes();
    return new Promise((resolve, reject) => {
      db.BoxNumbers.findAll()
        .then(async (boxNumbers: any) => {
          const boxAssignedButNotActivate = [];
          const boxAwaitingRecovation = [];
          this.dashboardBoxes.currentlyAssignedBox = boxNumbers.length;
          for (let o = 0; o <= boxNumbers.length - 1; o++) {
            const userStatus = await db.AccountStatus.findOne({
              where: { user_id: boxNumbers[o].user_id },
              order: [['created_at', 'DESC']],
            });
            if (userStatus) {
              if (
                userStatus.event_status !== AccountStatus.APPROVED &&
                userStatus.event_status !== AccountStatus.SUSPENDED &&
                userStatus.event_status !== AccountStatus.CLOSE
              ) {
                boxAssignedButNotActivate.push(userStatus);
              }
            }
            if (userStatus && userStatus.event_status === AccountStatus.SUSPENDED) {
              const suspendedDateAfter180days = new Date(
                userStatus.createdAt.setDate(userStatus.createdAt.getDate() + 180)
              );
              const currentDate = new Date();
              if (currentDate > suspendedDateAfter180days) {
                boxAwaitingRecovation.push(userStatus);
              }
            }
          }
          this.dashboardBoxes.boxAssignedButNotActivate = boxAssignedButNotActivate.length;
          this.dashboardBoxes.boxAwaitingRecovation = boxAwaitingRecovation.length;
          const data = this.dashboardBoxes;
          resolve({
            message: MESSAGES.DASHBOARD_BOX_STATS_GET_SUCCESS,
            status: STATUS.SUCCESS,
            dashboardBoxes: data,
            success: true,
          });
        })
        .catch(err => {
          reject({
            error: true,
            message: [MESSAGES.DASHBOARD_BOX_STATS_GET_ERROR, err],
            status: STATUS.INTERNAL_SERVER_ERROR,
          });
        });
    });
  }
}
