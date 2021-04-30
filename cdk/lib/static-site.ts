import * as cdk from '@aws-cdk/core';
import {Duration} from '@aws-cdk/core';
import {Bucket, BucketAccessControl} from "@aws-cdk/aws-s3";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {
    CachePolicy,
    Distribution,
    OriginAccessIdentity,
    PriceClass
} from "@aws-cdk/aws-cloudfront";
import {S3Origin} from "@aws-cdk/aws-cloudfront-origins";
import * as path from "path";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";
import {DnsValidatedCertificate} from "@aws-cdk/aws-certificatemanager";

export class StaticSite extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, domainName: string, siteDomain: string, zone: IHostedZone, certificate: DnsValidatedCertificate) {
        super(scope, id);

        const bucket = new Bucket(this, domainName, {
            accessControl: BucketAccessControl.PRIVATE
        });

        const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
        bucket.grantRead(originAccessIdentity);

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
            ttl: Duration.seconds(60),
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