# TensorRT 简介

**日期**: 2026-03-30
**标签**: DL_Deploy, TensorRT, NVIDIA

---

## 概述

TensorRT 是一个前向推理框架。在推理过程中，基于 TensorRT 的应用程序的执行速度可以比 CPU 平台速度快 40 倍。

## 核心特点

- 针对 NVIDIA GPU 优化
- 支持 INT8 和 FP16 量化
- 动态张量核心支持
- 层融合优化

## 硬件兼容性

不同的硬件需要匹配不同的 CUDA 库，然后还需要进行测试，比如选核等操作。

TensorRT 以 NVIDIA 的并行编程模型 CUDA 为基础构建而成。
