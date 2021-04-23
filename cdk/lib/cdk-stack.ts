import * as cdk from '@aws-cdk/core';
import {Duration} from '@aws-cdk/core';
import {Bucket, BucketAccessControl} from "@aws-cdk/aws-s3";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  PriceClass,
  SecurityPolicyProtocol
} from "@aws-cdk/aws-cloudfront";
import {S3Origin} from "@aws-cdk/aws-cloudfront-origins";
import * as path from "path";
import {ARecord, HostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";
import {DnsValidatedCertificate} from "@aws-cdk/aws-certificatemanager";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "kevintimmins.co.uk";
    const siteSubDomain = "www"

    const zone = HostedZone.fromLookup(this, 'Zone', { domainName: domainName });
    const siteDomain = siteSubDomain + '.' + domainName;
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    const bucket = new Bucket(this, 'kevintimmins.co.uk', {
      accessControl: BucketAccessControl.PRIVATE
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    bucket.grantRead(originAccessIdentity);

    const certificate = new DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
    });

    const distribution = new Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucket, {originAccessIdentity}),
        cachePolicy: new CachePolicy(this, 'kevintimmins-cache-policy', {
          maxTtl: Duration.seconds(60)
        })
      },
      certificate: certificate,
      domainNames: [siteDomain],
      priceClass: PriceClass.PRICE_CLASS_100
    });

    new ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone
    });

    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, '../../web-app/build'))],
      distribution,
      distributionPaths: ['/*']
    });
  }
}
