package com.expensetracker.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expensetracker.entity.Asset;
import com.expensetracker.entity.User;
import com.expensetracker.repository.AssetRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    public AssetController(AssetRepository assetRepository, UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Asset>> getUserAssets(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Asset> assets = assetRepository.findByUserId(userPrincipal.getId());
        return ResponseEntity.ok(assets);
    }

    @PostMapping
    public ResponseEntity<Asset> createAsset(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Asset asset) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        asset.setUser(user);
        Asset savedAsset = assetRepository.save(asset);
        return ResponseEntity.ok(savedAsset);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody Asset updatedAsset) {
        Asset existingAsset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        if (!existingAsset.getUser().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(403).build();
        }

        existingAsset.setName(updatedAsset.getName());
        existingAsset.setType(updatedAsset.getType());
        existingAsset.setInstitution(updatedAsset.getInstitution());
        existingAsset.setCurrentValue(updatedAsset.getCurrentValue());
        existingAsset.setPurchaseValue(updatedAsset.getPurchaseValue());
        existingAsset.setCurrency(updatedAsset.getCurrency());
        existingAsset.setNotes(updatedAsset.getNotes());

        return ResponseEntity.ok(assetRepository.save(existingAsset));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        Asset existingAsset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        if (!existingAsset.getUser().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(403).build();
        }

        assetRepository.delete(existingAsset);
        return ResponseEntity.noContent().build();
    }
}
