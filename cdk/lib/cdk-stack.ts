import * as cdk from '@aws-cdk/core';
import {HostedZone} from "@aws-cdk/aws-route53";
import {DnsValidatedCertificate} from "@aws-cdk/aws-certificatemanager";

import {StaticSite} from './static-site'

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "kevintimmins.co.uk";
    const siteSubDomain = "www";

    const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {hostedZoneId: 'Z034496529C3MBFLF7E6A', zoneName: 'kevintimmins.co.uk'})
    const siteDomain = siteSubDomain + '.' + domainName;
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    const certificate = new DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: `*.${domainName}`,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
    });

    new StaticSite(this, 'StaticSite', domainName, siteDomain, zone, certificate);
  }
}
