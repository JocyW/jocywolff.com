import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// --- Configuration Variables ---
// You will need to replace these with your actual values.
// The domain name for your website.
const certificateArn = "arn:aws:acm:us-east-1:767397992899:certificate/0b3643d0-69a3-461b-bf52-5b29143029f2";

const domains = [{
    name: "jocywolff.com",
    hostedZoneId: "Z00904551SSPAC54YB680",
}, {
    name: "j2y.io",
    hostedZoneId: "Z02883131ORG8LW5XATI0",
}];

const bucket = new aws.s3.Bucket("jocywolff.com", {
    bucket: "jocywolff.com",
    grants: [{
        id: "a60606d6ca1fbff30c43f10d2b0e8ef87325e80560f0f0a87c042949eb7ebc92",
        permissions: ["FULL_CONTROL"],
        type: "CanonicalUser",
    }],
    region: "eu-west-1",
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

const website = new aws.s3.BucketWebsiteConfiguration("jocywolff.com", {
    bucket: bucket.id,
    indexDocument: {
        suffix: "index.html",
    },
    errorDocument: {
        key: "index.html",
    },
});

const originRequestPolicy = await aws.cloudfront.getOriginRequestPolicy({
    name: "Managed-CORS-S3Origin",
});

const responseHeadersPolicy = await aws.cloudfront.getResponseHeadersPolicy({
    name: "Managed-CORS-With-Preflight",
});

const cachePolicy = await aws.cloudfront.getCachePolicy({
    name: "Managed-CachingDisabled",
});

// --- 3. Create a CloudFront Distribution ---
// This CDN will cache your website content and serve it globally,
// improving performance and reducing latency.
const distribution = new aws.cloudfront.Distribution("jocywolff.com", {
    aliases: [
        "j2y.io",
        "jocywolff.com",
    ],
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
}, {
    protect: true,
});

const records = domains.map((domain) => {
    return {
        ...domain,
        record: new aws.route53.Record(`${domain.name}_A`, {
            zoneId: domain.hostedZoneId,
            name: domain.name,
            type: aws.route53.RecordType.A,
            aliases: [{
                evaluateTargetHealth: false,
                name: distribution.domainName,
                zoneId: distribution.hostedZoneId,
            }],
        }),
    }
});


// --- Export the output values ---
// These values will be displayed after a successful `pulumi up`.
export const bucketName = bucket.id;
export const cdnDomainName = distribution.domainName;
export const recordNames = records.map((record) => record.record.name);
export const cdnUrl = pulumi.interpolate`https://${distribution.domainName}`;
export const websiteUrl = pulumi.interpolate`https://${records.map((record) => record.record.name).join(", ")}`;
