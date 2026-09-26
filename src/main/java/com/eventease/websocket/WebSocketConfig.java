package com.eventease.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Mengaktifkan in-memory message broker untuk topic (broadcast pub/sub) dan queue (user-targeted)
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix untuk pesan yang dikirim dari client ke controller @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket utama yang dihubungkan oleh frontend (React, web client)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback untuk browser yang tidak mendukung WebSocket murni

        // Endpoint WebSocket murni (tanpa SockJS) untuk client modern
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
