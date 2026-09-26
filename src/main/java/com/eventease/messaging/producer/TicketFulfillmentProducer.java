package com.eventease.messaging.producer;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.eventease.messaging.RabbitMQConfig;
import com.eventease.messaging.dto.TicketFulfillmentMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketFulfillmentProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Mengirim pesan penerbitan tiket ke antrean RabbitMQ secara asinkron.
     * Mengembalikan true jika berhasil dikirim ke antrean, false jika terjadi kendala koneksi broker.
     */
    public boolean publishTicketFulfillment(TicketFulfillmentMessage message) {
        try {
            log.info("Menerbitkan pesan tiket ke RabbitMQ Queue [{}]: Booking ID = {}", 
                    RabbitMQConfig.QUEUE_TICKET_FULFILLMENT, message.getBookingId());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_DIRECT,
                    RabbitMQConfig.ROUTING_KEY_TICKET_FULFILLMENT,
                    message
            );
            return true;
        } catch (Exception ex) {
            log.warn("Tidak dapat mengirim pesan ke RabbitMQ Broker (Broker offline atau timeout): {}. Menggunakan fallback eksekusi langsung.", ex.getMessage());
            return false;
        }
    }
}
