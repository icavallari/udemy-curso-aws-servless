import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { Product, ProductRepository } from "/opt/nodejs/productsLayer"
import { DynamoDB } from "aws-sdk"

const productsDdb = process.env.PRODUCTS_DDB!
const ddbClient = new DynamoDB.DocumentClient()
const productRepository = new ProductRepository(ddbClient, productsDdb)

export async function handler(
    event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult>{

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.requestContext.requestId

    console.log(`API GATEWAY REQUESTID : ${apiRequestId} - LAMBDA REQUESTID: ${lambdaRequestId}`)

    const method = event.httpMethod
    if(event.resource === "/products"){

        if(method === "POST"){
            console.log("POST /products")

            const product = JSON.parse(event.body!) as Product
            const productCreated = await productRepository.create(product)

            return {
                statusCode: 201,
                body: JSON.stringify(productCreated)
            }
        } 

    } else if(event.resource === "/products/{id}"){

        const productId = event.pathParameters!.id as string      
        
        if(method === "PUT"){
            console.log(`PUT /products/${productId}`)

            const product = JSON.parse(event.body!) as Product
            try{
                const productUpdated = await productRepository.updateProduct(productId, product)
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(productUpdated)
                }
                
            } catch( ConditionalCheckFailedException ){

                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: 'Product not found'
                    })
                }

            }

        } else if(method === "DELETE"){
            console.log(`DELETE /products/${productId}`)

            try{

                const product = await productRepository.delete(productId)
                return {
                    statusCode: 200,
                    body: JSON.stringify(product)
                }

            } catch( error ){
                console.error((<Error>error).message)

                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: (<Error>error).message
                    })
                }

            }
            
        }

    }

    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "Bad request"
        })
    }

}