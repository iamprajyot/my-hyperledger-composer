/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */
 /**
 * Place an order for a product
 * @param {org.synerzip.firstcomposer.PlaceOrder} placeOrder - the PlaceOrder transaction
 * @transaction
 */
async function placeOrder(orderRequest) { // eslint-disable-line no-unused-vars
    console.log('placeOrder');

    const factory = getFactory();
    const namespace = 'org.synerzip.firstcomposer';

    const order = factory.newResource(namespace, 'Order', orderRequest.orderId);
    order.productType = orderRequest.productType;
    order.orderStatus = 'PLACED';
    order.orderer = factory.newRelationship(namespace, 'User', orderRequest.orderer.getIdentifier());

    // save the order
    const assetRegistry = await getAssetRegistry(order.getFullyQualifiedType());
    await assetRegistry.add(order);

    // emit the event
    // const placeOrderEvent = factory.newEvent(namespace, 'PlaceOrderEvent');
    // placeOrderEvent.orderId = order.orderId;
    // placeOrderEvent.vehicleDetails = order.vehicleDetails;
    // placeOrderEvent.options = order.options;
    // placeOrderEvent.orderer = order.orderer;
    // emit(placeOrderEvent);
}

/**
 * Place an order for a product
 * @param {org.synerzip.firstcomposer.IssueProductAndUpdateOrderStatus} issueProductAndUpdateOrderStatus
 * @transaction
 */
async function issueProductAndUpdateOrderStatus(updateOrderRequest) { 
    console.log('updateOrderStatus');

    const factory = getFactory();
    const namespace = 'org.synerzip.firstcomposer';

    // get order asset
    const order = updateOrderRequest.order;

    // check product available or not
    const products = await query('getAvailableProductByType', {type: order.productType});
    if(products.length == 0){
        throw new Error('Product is not available');
    }
    const product = products[0]
    const productRegistry = await getAssetRegistry(namespace + '.Product');
    // if product is available, update its properties and save to product registry
    product.status = 'ISSUED'
    product.assignedTo = factory.newRelationship(namespace, 'User', order.orderer.employeeId);
    product.issuedBy = factory.newRelationship(namespace, 'ItAdmin', updateOrderRequest.issuer.employeeId);
    await productRegistry.update(product);
    // update order
    order.orderStatus = 'FULFILLED';
    order.issuer = factory.newRelationship(namespace, 'ItAdmin', updateOrderRequest.issuer.employeeId)

    const orderRegistry = await getAssetRegistry(namespace + '.Order');
    await orderRegistry.update(order);

    // emit the event
    // const updateOrderStatusEvent = factory.newEvent(namespace, 'UpdateOrderStatusEvent');
    // updateOrderStatusEvent.orderStatus = updateOrderRequest.order.orderStatus;
    // updateOrderStatusEvent.order = updateOrderRequest.order;
    // emit(updateOrderStatusEvent);
}
