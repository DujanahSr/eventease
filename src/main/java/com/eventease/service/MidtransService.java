package com.eventease.service;

import com.eventease.model.Booking;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class MidtransService {

    @Value("${midtrans.server.key}")
    private String serverKey;

    @Value("${midtrans.is.production}")
    private boolean isProduction;

    public String getSnapToken(Booking booking) {
        RestTemplate restTemplate = new RestTemplate();
        
        String url = isProduction ? 
                "https://app.midtrans.com/snap/v1/transactions" : 
                "https://app.sandbox.midtrans.com/snap/v1/transactions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((serverKey.trim() + ":").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        headers.set("Authorization", authHeader);

        // Calculate amount
        double amount = booking.getTicketCategory().getPrice() * booking.getParticipants();

        Map<String, Object> requestBody = new HashMap<>();
        
        Map<String, Object> transactionDetails = new HashMap<>();
        // Midtrans menolak order_id yang sama jika sebelumnya transaksi berstatus pending/failed.
        // Solusinya: Tambahkan timestamp agar selalu unik setiap kali mencoba bayar.
        String uniqueOrderId = booking.getId() + "-" + System.currentTimeMillis();
        transactionDetails.put("order_id", uniqueOrderId);
        transactionDetails.put("gross_amount", (int) amount);
        
        Map<String, Object> customerDetails = new HashMap<>();
        customerDetails.put("first_name", booking.getUser().getName());
        customerDetails.put("email", booking.getUser().getEmail());

        requestBody.put("transaction_details", transactionDetails);
        requestBody.put("customer_details", customerDetails);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> body = response.getBody();
                if (body != null) {
                    Object tokenObj = body.get("token");
                    if (tokenObj != null) {
                        String token = tokenObj.toString();
                        booking.setMidtransOrderId(uniqueOrderId);
                        booking.setSnapToken(token);
                        return token;
                    }
                }
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            e.printStackTrace();
            System.err.println("Midtrans Error Response: " + e.getResponseBodyAsString());
            return "Error Midtrans (401): Pastikan Server Key di application.properties benar!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
        
        return null;
    }

    public Map<String, Object> getTransactionStatus(String orderId) {
        if (orderId == null || orderId.isBlank()) return null;
        RestTemplate restTemplate = new RestTemplate();
        String url = isProduction ? 
                "https://api.midtrans.com/v2/" + orderId + "/status" : 
                "https://api.sandbox.midtrans.com/v2/" + orderId + "/status";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((serverKey.trim() + ":").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        headers.set("Authorization", authHeader);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("Gagal mengecek status transaksi Midtrans orderId " + orderId + ": " + e.getMessage());
        }
        return null;
    }
}
