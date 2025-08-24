import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetHeader } from './sheet-header';

describe('SheetHeader', () => {
  let component: SheetHeader;
  let fixture: ComponentFixture<SheetHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheetHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
