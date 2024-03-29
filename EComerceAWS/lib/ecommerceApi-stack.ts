import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as cwlogs from "aws-cdk-lib/aws-logs"

import { Construct } from "constructs"

interface EcommerceApiStackProps extends cdk.StackProps{
    productsFetchHandler: lambdaNodeJs.NodejsFunction
    productsAdminHandler: lambdaNodeJs.NodejsFunction
}

export class ECommerceApiStack extends cdk.Stack{

    constructor(scope: Construct, id: string, props: EcommerceApiStackProps){
        super(scope, id, props)

        const logGroup = new cwlogs.LogGroup(this, "EcommerceApiLogs")
        const api = new apigateway.RestApi(this, "ECommerceApi", {
            restApiName: "ECommerceApi",
            cloudWatchRole: true,
            deployOptions:{
                accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    ip: true,
                    user: true,
                    status: true,
                    caller: true,
                    protocol: true,
                    httpMethod: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                })
            }
        })

        const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)

        // GET "/products"
        const productsResource = api.root.addResource("products")
        productsResource.addMethod("GET", productsFetchIntegration)

        // GET "/products/{id}"
        const productsIdResouce = productsResource.addResource("{id}")
        productsIdResouce.addMethod("GET", productsFetchIntegration)

        const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

        // POST "/products"
        productsResource.addMethod("POST", productsAdminIntegration)

        // PUT "/products/{id}"
        productsIdResouce.addMethod("PUT", productsAdminIntegration)

        // DELETE "/products/{id}"
        productsIdResouce.addMethod("DELETE", productsAdminIntegration)

    }

}