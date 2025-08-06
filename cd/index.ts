import {s3,cloudfront, route53} from '@pulumi/aws'
import {Config} from '@pulumi/pulumi'

const awsConfig = new Config('aws');
const awsRegion = awsConfig.require('region')

const config = new Config()
const certificateArn = config.require('certificateArn');
const env = config.require('env');
const resoucePrefix = config.require('resourcePrefix')

const domains = config.requireObject<Array<{
    name: string,
    hostedZoneId: string
}>>('domains')

const bucket = new s3.Bucket(resoucePrefix, {
    bucket: resoucePrefix,
    region: awsRegion,
    requestPayer: "BucketOwner",
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
        },
    }
});
const BucketPublicAccessBlock = new s3.BucketPublicAccessBlock(resoucePrefix, {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});
const exampleBucketOwnershipControls = new s3.BucketOwnershipControls(resoucePrefix, {
    bucket: bucket.id,
    rule: {
        objectOwnership: "BucketOwnerPreferred",
    },
});

const website = new s3.BucketWebsiteConfiguration(resoucePrefix, {
    bucket: bucket.id,
    indexDocument: {
        suffix: "index.html",
    },
    errorDocument: {
        key: "index.html",
    },
});

const originRequestPolicy = await cloudfront.getOriginRequestPolicy({
    name: "Managed-CORS-S3Origin",
});

const responseHeadersPolicy = await cloudfront.getResponseHeadersPolicy({
    name: "Managed-CORS-With-Preflight",
});

const cachePolicy = await cloudfront.getCachePolicy({
    name: "Managed-CachingDisabled",
});

const distribution = new cloudfront.Distribution(resoucePrefix, {
    aliases: domains.map(domain => domain.name),
    customErrorResponses: [{
        errorCachingMinTtl: 10,
        errorCode: 403,
        responseCode: 200,
        responsePagePath: "/index.html",
    }],
    defaultCacheBehavior: {
        allowedMethods: [
            "GET",
            "HEAD",
        ],
        cachePolicyId: cachePolicy.id,
        cachedMethods: [
            "GET",
            "HEAD",
        ],
        compress: true,
        originRequestPolicyId: originRequestPolicy.id,
        responseHeadersPolicyId: responseHeadersPolicy.id,
        targetOriginId: bucket.bucketRegionalDomainName,
        viewerProtocolPolicy: "redirect-to-https",
    },
    defaultRootObject: "index.html",
    enabled: true,
    httpVersion: "http2",
    isIpv6Enabled: true,
    orderedCacheBehaviors: [],
    origins: [
        {
            customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "http-only",
                originSslProtocols: [
                    "SSLv3",
                    "TLSv1",
                    "TLSv1.1",
                    "TLSv1.2",
                ],
            },
            domainName: bucket.bucketRegionalDomainName,
            originId: bucket.bucketRegionalDomainName,
        },
    ],
    priceClass: "PriceClass_All",
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        acmCertificateArn: certificateArn,
        minimumProtocolVersion: "TLSv1.2_2021",
        sslSupportMethod: "sni-only",
    },
});

const records = domains.map((domain) => 
    new route53.Record(`${domain.name}_A`, {
            zoneId: domain.hostedZoneId,
            name: domain.name,
            type: route53.RecordType.A,
            aliases: [{
                evaluateTargetHealth: false,
                name: distribution.domainName,
                zoneId: distribution.hostedZoneId,
            }],
        }),
);

export const bucketName = bucket.id;
export const cdnDomainName = distribution.domainName;
export const recordNames = records.map((record) => record.name);
export const cdnUrl = `https://${distribution.domainName}`;
export const websiteUrl = records.map((record) => `https://${record.name}`)
