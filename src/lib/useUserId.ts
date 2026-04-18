"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// 用于生成或获取当前浏览器的唯一 UserID
export function useUserId() {
  const [userId, setUserId] = useState<string>("demo-user-123"); // 默认值防止 SSR 报错

  useEffect(() => {
    // 仅在客户端执行
    const storedId = localStorage.getItem("cruise_user_id");
    if (storedId) {
      setUserId(storedId);
    } else {
      const newId = uuidv4();
      localStorage.setItem("cruise_user_id", newId);
      setUserId(newId);
    }
  }, []);

  return userId;
}
