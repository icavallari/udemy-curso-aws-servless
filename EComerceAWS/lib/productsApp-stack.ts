//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html
import * as lambda from "aws-cdk-lib/aws-lambda"

//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs"

//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
import * as cdk from "aws-cdk-lib"

import * as dynamoDatabase from 'aws-cdk-lib/aws-dynamodb'

import { Construct } from "constructs"

export class ProductAppStack extends cdk.Stack{

    readonly productsFetchHandler: lambdaNodeJs.NodejsFunction
    readonly productsAdminHandler: lambdaNodeJs.NodejsFunction
    readonly productsTable : dynamoDatabase.Table

    constructor(scope: Construct, id : string, props?: cdk.StackProps){
        super(scope, id, props);

        this.productsTable = new dynamoDatabase.Table(this, "ProductsDb", {
            tableName: "products",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            partitionKey: {
                name: "id",
                type: dynamoDatabase.AttributeType.STRING
            },
            billingMode: dynamoDatabase.BillingMode.PROVISIONED,
            readCapacity: 1,
            writeCapacity: 1
        })

        this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(this, 
            "ProductsFetchFunction", {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "ProductsFetchFunction",
                entry: "lambda/products/productsFetchFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(5),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    PRODUCTS_TABLE : this.productsTable.tableName
                }
            })

        this.productsTable.grantReadData(this.productsFetchHandler)

        this.productsAdminHandler = new lambdaNodeJs.NodejsFunction(this, 
            "ProductsAdminFunction", {
                runtime: lambda.Runtime.NODEJS_20_X,
                functionName: "ProductsAdminFunction",
                entry: "lambda/products/productsAdminFunction.ts",
                handler: "handler",
                memorySize: 512,
                timeout: cdk.Duration.seconds(5),
                bundling: {
                    minify: true,
                    sourceMap: false
                },
                environment: {
                    PRODUCTS_TABLE : this.productsTable.tableName
                }
            })

        this.productsTable.grantWriteData(this.productsAdminHandler)

    }

}

