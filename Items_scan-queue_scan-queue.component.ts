import { ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ScanQueue, ScanQueueExpedition } from '../../../models/scan-queue-model';
import * as Services from '../../../services';

@Component({
  selector: 'usgm-scan-queue',
  templateUrl: './scan-queue.component.html',
  styleUrls: ['./scan-queue.component.scss'],
})
export class ScanQueueComponent implements OnInit, OnDestroy {

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();
  public loading = false;
  dialogRef: any;
  private _unSubscribeAll: Subject<any> = new Subject();


  // Scan Expedition Request
  displayedExpeditionColumns: string[] = [
    'boxItem',
    'name',
    'type',
    'sender',
    'requestedOn',
    'arrived',
    'entered',
  ];

  // Scan Request
  displayedColumns: string[] = [
    'boxItem',
    'name',
    'type',
    'sender',
    'requestedOn',
    'arrived',
    'entered',
  ];
  requestDataSource: MatTableDataSource<ScanQueueExpedition>;
  ExpeditiondataSource: MatTableDataSource<ScanQueueExpedition>;

  scanQueueExpeditionData: ScanQueueExpedition[] = [];
  scanData: ScanQueue[] = [];

  expeditionDataSourceLength = 0;
  dataSourceLength = 0;

  scanResuestIndex = 0;
  expeditionIndex = 0;

  constructor(
    public _matDialog: MatDialog,
    protected apiMapping: Services.ApiMapping,
    protected notificationService: Services.NotificationService,
    private userService: Services.UploadScanService,
    protected http: Services.UsgmHttp,
    private router: Router,
    private cdref: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.getScanQueueExpedition();
    this.getScanQueue();
  }

  getScanQueueExpedition() {
    this.loading = true;
    this.userService
      .scanExpedition(
        this.apiMapping.getScanQueueExpeditionData(this.expeditionIndex),
      )
      .pipe(takeUntil(this._unSubscribeAll))
      .subscribe(
        (data: any) => {
          this.loading = false;
          if (data.scans) {
            this.gridSetExpedition(data.scans);
            this.expeditionDataSourceLength = data.scans.length;
          }
          // console.log('datadatadata', data.scans);
        },
        (err: any) => {
          this.loading = false;
          this.notificationService.showError(
            'Unable to fetch Expedition Data. Please try again.',
          );
        },
      );
  }

  gridSetExpedition(data) {
    this.ExpeditiondataSource = new MatTableDataSource(data);
    this.ExpeditiondataSource.paginator = this.paginator.toArray()[0];
    this.ExpeditiondataSource.sort = this.sort.toArray()[0];
    console.log(this.paginator.toArray());
  }

  pageIndexExpedition(event): void {
    console.log(event);
    this.expeditionIndex = event.pageIndex;
    this.getScanQueueExpedition();
  }

  getScanQueue() {
    this.loading = true;
    this.userService
      .scanRequest(this.apiMapping.getScanQueueData(this.scanResuestIndex))
      .pipe(takeUntil(this._unSubscribeAll))
      .subscribe(
        (data: any) => {
          this.loading = false;
          if (data.scans) {
            this.gridSet(data.scans);
            this.dataSourceLength = data.scans.length;
          }
        },
        (error: any) => {
          this.loading = false;
          this.notificationService.showError(
            'Unable to fetch scan request Data. Please try again.',
          );
        },
      );
  }

  gridSet(data) {
    this.cdref.detectChanges();
    this.requestDataSource = new MatTableDataSource(data);
    this.requestDataSource.paginator = this.paginator.toArray()[1];
    console.log(this.paginator.toArray()[1]);
    this.requestDataSource.sort = this.sort.toArray()[1];
  }

  pageIndexScanRequest(event): void {
    console.log(event);
    this.scanResuestIndex = event.pageIndex;
    this.getScanQueue();
  }
  onUploadScan(element, type, index): void {
    this.userService.selectedData.next(element);
    console.log(index);
    this.router.navigate([
      '/upload-scan-queue/' + type + '/' + element.id,
    ]);
  }

  ngOnDestroy(): void {
    this._unSubscribeAll.next();
    this._unSubscribeAll.complete();
  }
}
