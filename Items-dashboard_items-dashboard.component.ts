import { Component, OnInit } from '@angular/core';
import * as Services from '../../../services';
import { ItemService } from '../../../services/items/item.service';

@Component({
  selector: 'usgm-items-dashboard',
  templateUrl: './items-dashboard.component.html'
})
export class ItemsDashboardComponent implements OnInit {

  public loading = false;
  public misPlacedItems: number;
  public itemsInScanQueue = 0;
  public itemsInPackageDiscardQueue: any;
  public warehouseDetails: any;

  constructor(
    private itemService: ItemService,
    protected apiMapping: Services.ApiMapping,
    protected notificationService: Services.NotificationService,
    protected http: Services.UsgmHttp,
  ) { }

  ngOnInit() {
    this.getItemDashboardWidgets();
    this.getMisplacedMailCount();
    this.getDiscardedPackageCount();
    this.getWareHouseDetails();
  }

  public getItemDashboardWidgets() {
    this.loading = true;
    this.itemService.getItemDashboardWidgets()
      .then(
        (data: any) => {
          if (data.count) {
            this.itemsInScanQueue = data.count;
          }
        }).catch(
          (err: any) => {
            this.notificationService.showError('Unable to fetch Expedition Data. Please try again.');
          });
  }

  getMisplacedMailCount() {
    this.itemService.getMisplacedMailCount()
      .then(
        (data: any) => {
          this.misPlacedItems = data.result.misplaceditemcount;
        },
        (err: any) => {
          this.notificationService.showError('Unable to fetch misplaced mail count Data. Please try again.');
        }
      );
  }

  getDiscardedPackageCount() {
    this.itemService.getDiscardedPackageCount()
      .then(
        (data: any) => {
          this.itemsInPackageDiscardQueue = data.result.packagediscardedqueuecount;
        },
        (err: any) => {
          this.notificationService.showError('Unable to fetch discarded package count Data. Please try again.');
        }
      );
  }
  getWareHouseDetails() {
    this.itemService.getWareHouseDetails()
      .then(
        (data: any) => {
          this.warehouseDetails = data.warehouseDetail;
        },
        (err: any) => {
          this.notificationService.showError('Unable to fetch warehouse Details. Please try again.');
        }
      );
  }
}
