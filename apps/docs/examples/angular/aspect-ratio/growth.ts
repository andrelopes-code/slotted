import { Component } from '@angular/core';
import { SlAspectRatio } from '@slotted/angular/aspect-ratio';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-aspect-ratio-growth',
  imports: [SlAspectRatio, SlCard, SlCardBody, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slAspectRatio ratio="video">
        <div slCard>
          <div slCardBody>
            <p slText>Pickup window: 08:00 to 10:00.</p>
          </div>
        </div>
      </div>
      <div slAspectRatio ratio="video">
        <div slCard>
          <div slCardBody>
            <p slText>
              Harbor Line moved the pickup for orders 20418 to 20431 from the morning window to the
              afternoon window because the vessel from Singapore docked six hours late. The
              Rotterdam warehouse holds the pallets on dock 4 until the carrier confirms the new
              slot. Customers with a delivery promise before Thursday receive an email with the new
              date, and the support team sees the same date on the order. Orders paid by transfer
              are released after the payment clears.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AspectRatioGrowth {}
