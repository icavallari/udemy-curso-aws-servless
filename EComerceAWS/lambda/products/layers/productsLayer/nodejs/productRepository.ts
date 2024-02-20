import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { v4 as uuid } from "uuid"

export interface Product {
    id: string
    productName: string
    code: string
    price: number
    model: string
}

export class ProductRepository {

    private ddbCliente: DocumentClient
    private productsDdb: string

    constructor(ddbCliente: DocumentClient, productsDdb: string) {
        this.ddbCliente = ddbCliente
        this.productsDdb = productsDdb
    }

    async getAllProducts(): Promise<Product[]> {

        const data = await this.ddbCliente.scan({
            TableName: this.productsDdb
        }).promise()

        return data.Items as Product[]

    }

    async getProductById(productId: string): Promise<Product>{

        const data = await this.ddbCliente.get({
            TableName: this.productsDdb,
            Key: {
                id: productId
            }
        }).promise()

        if (data.Item){
            return data.Item as Product
        }

        throw new Error('Product not found')

    }

    async create(product: Product): Promise<Product>{

        product.id = uuid()
        await this.ddbCliente.put({
            TableName: this.productsDdb,
            Item: product
        }).promise()
        
        return product

    }

    async delete(productId: string): Promise<Product>{

        const data = await this.ddbCliente.delete({
            TableName: this.productsDdb,
            Key: {
                id: productId
            },
            ReturnValues: "ALL_OLD"
        }).promise()

        if( data.Attributes){
            return data.Attributes as Product    
        }

        throw new Error("Product not found")

    }

    async updateProduct(productId: string, product: Product): Promise<Product>{

        const data = await this.ddbCliente.update({
            TableName: this.productsDdb,
            Key: {
                id: productId
            },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: "UPDATED_NEW",
            UpdateExpression: "set productName = :n, code = :c, price = :p, model = :m",
            ExpressionAttributeValues: {
                ":n": product.productName,
                ":c": product.code,
                ":p": product.price,
                ":m": product.model
            }
        }).promise()

        data.Attributes!.id = productId
        return data.Attributes as Product

    }

    //  ReturnValues: "NONE" || "ALL_OLD" || "UPDATED_OLD" || "ALL_NEW" || "UPDATED_NEW",
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/UpdateItemCommand/


}