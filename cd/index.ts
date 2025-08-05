import {s3,cloudfront, route53} from '@pulumi/aws'
import {Config} from '@pulumi/pulumi'

const awsConfig = new Config('aws');
const awsRegion = awsConfig.require('region')

const config = new Config()
const certificateArn = config.require('certificateArn');
const env = config.require('env');

const domains = config.requireObject<Array<{
    name: string,
    hostedZoneId: string
}>>('domains')

const bucket = new s3.Bucket("jocywolff.com", {
    bucket: "jocywolff.com",
    grants: [{
        id: "a60606d6ca1fbff30c43f10d2b0e8ef87325e80560f0f0a87c042949eb7ebc92",
        permissions: ["FULL_CONTROL"],
        type: "CanonicalUser",
    }],
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
}, {
    protect: true,
});

const website = new s3.BucketWebsiteConfiguration("jocywolff.com", {
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

const distribution = new cloudfront.Distribution("jocywolff.com", {
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
