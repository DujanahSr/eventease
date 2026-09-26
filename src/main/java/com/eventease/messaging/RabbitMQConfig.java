package com.eventease.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_DIRECT = "eventease.direct.exchange";
    public static final String QUEUE_TICKET_FULFILLMENT = "ticket.fulfillment.queue";
    public static final String ROUTING_KEY_TICKET_FULFILLMENT = "ticket.fulfillment.key";

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(EXCHANGE_DIRECT, true, false);
    }

    @Bean
    public Queue ticketFulfillmentQueue() {
        return new Queue(QUEUE_TICKET_FULFILLMENT, true);
    }

    @Bean
    public Binding ticketFulfillmentBinding(Queue ticketFulfillmentQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(ticketFulfillmentQueue)
                .to(directExchange)
                .with(ROUTING_KEY_TICKET_FULFILLMENT);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
