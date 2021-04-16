import * as cdk from '@aws-cdk/core';
import {Bucket, BucketAccessControl} from "@aws-cdk/aws-s3";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {Distribution, OriginAccessIdentity, PriceClass, CachePolicy} from "@aws-cdk/aws-cloudfront";
import {S3Origin} from "@aws-cdk/aws-cloudfront-origins";
import * as path from "path";
import {Duration} from "@aws-cdk/core";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'kevintimmins.co.uk', {
      accessControl: BucketAccessControl.PRIVATE
    });

    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, '../../web-app/build'))]
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    bucket.grantRead(originAccessIdentity);

    new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucket, {originAccessIdentity}),
        cachePolicy: new CachePolicy(this, 'kevintimmins-cache-policy', {
          maxTtl: Duration.seconds(60)
        })
      },
      priceClass: PriceClass.PRICE_CLASS_100
    })
  }
}
