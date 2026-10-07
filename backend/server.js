require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const PG = require("./models/PG");
const Block = require("./models/Block");
const Floor = require("./models/Floor");
const Room = require("./models/Room");
const Bed = require("./models/Bed");
const Tenant = require("./models/Tenant");
const Payment = require("./models/Payment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });

const PORT = process.env.PORT || 5000;

//ragister

app.post("/api/auth/register", async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

    const existingUser = await User.findOne({
      email: req.body.email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }


    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: "tenant",
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "User creation failed",
      error: error.message,
    });
  }
});


//login 

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Check if password exists
    if (!user.password) {
      return res.status(401).json({
        message: "Password not set for this account",
      });
    }

    // 3.1 Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});


// Owner signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // 1. Required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    // 2. Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create owner
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      password: hashedPassword,
      isPasswordSet: true,
      role: "owner",
    });

    // 5. Response
    res.status(201).json({
      message: "Owner account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Owner signup failed",
      error: error.message,
    });
  }
});


app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    // 1. Get logged-in user
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 2. Find PG owned by this user
    const pg = await PG.findOne({
      owner: user._id,
    });

    // 3. Send user + PG information
    res.status(200).json({
      message: "Authenticated user",
      user,
      pg: pg
        ? {
            id: pg._id,
            name: pg.name,
            type: pg.type,
            address: pg.address,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
});


// Get all users/tenants of owner's PG
app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware("owner"),
  async (req, res) => {
    try {
      // 1. Find owner's PG
      const pg = await PG.findOne({
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found",
        });
      }

      // 2. Find tenants of this PG
      const tenants = await Tenant.find({
        pg: pg._id,
      }).populate("user", "name email phone role");

      // 3. Format users
      const users = tenants
        .filter((tenant) => tenant.user)
        .map((tenant) => ({
          userId: tenant.user._id,
          tenantId: tenant._id,
          name: tenant.user.name,
          email: tenant.user.email,
          phone: tenant.user.phone,
          role: tenant.user.role,
        }));

      res.status(200).json({
        message: "Users fetched successfully",
        users,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }
);

app.patch(
  "/api/users/:userId/role",
  authMiddleware,
  roleMiddleware("owner"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Sirf tenant → admin allowed
      if (role !== "admin") {
        return res.status(400).json({
          message: "Only tenant to admin role change is allowed",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Owner ka role change nahi ho sakta
      if (user.role === "owner") {
        return res.status(400).json({
          message: "Owner role cannot be changed",
        });
      }

      user.role = "admin";
      await user.save();

      return res.status(200).json({
        message: "User promoted to admin successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to update user role",
        error: error.message,
      });
    }
  }
);  


// pg creation
app.post("/api/pg", authMiddleware, async (req, res) => {
  try {
    const { name, type, address } = req.body;

    if (!name || !type || !address) {
      return res.status(400).json({
        message: "Name, type and address are required",
      });
    }

    const pg = await PG.create({
      name,
      type,
      address,
      owner: req.user.userId,
    });

    res.status(201).json({
      message: "PG created successfully",
      pg,
    });
  } catch (error) {
    res.status(500).json({
      message: "PG creation failed",
      error: error.message,
    });
  }
});


//block creation
app.post("/api/pg/:pgId/blocks", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const { pgId } = req.params;

    if (!name) {
      return res.status(400).json({
        message: "Block name is required",
      });
    }

    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    const block = await Block.create({
      name,
      pg: pgId,
    });

    res.status(201).json({
      message: "Block created successfully",
      block,
    });
  } catch (error) {
    res.status(500).json({
      message: "Block creation failed",
      error: error.message,
    });
  }
});

// floor creation
app.post("/api/blocks/:blockId/floors", authMiddleware, async (req, res) => {
  try {
    const { floorNumber } = req.body;
    const { blockId } = req.params;

    if (!floorNumber) {
      return res.status(400).json({
        message: "Floor number is required",
      });
    }

    if (floorNumber < 1 || floorNumber > 5) {
      return res.status(400).json({
        message: "Floor number must be between 1 and 5",
      });
    }

    const block = await Block.findById(blockId);

    if (!block) {
      return res.status(404).json({
        message: "Block not found",
      });
    }

    const pg = await PG.findOne({
      _id: block.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    const existingFloor = await Floor.findOne({
      block: blockId,
      floorNumber,
    });

    if (existingFloor) {
      return res.status(409).json({
        message: "This floor already exists in this block",
      });
    }

    const floor = await Floor.create({
      floorNumber,
      block: blockId,
    });

    res.status(201).json({
      message: "Floor created successfully",
      floor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Floor creation failed",
      error: error.message,
    });
  }
});

// Room creation 

app.post("/api/floors/:floorId/rooms", authMiddleware, async (req, res) => {
  try {
    const { roomNumber, sharingType } = req.body;
    const { floorId } = req.params;

    // Check required fields
    if (!roomNumber || !sharingType) {
      return res.status(400).json({
        message: "Room number and sharing type are required",
      });
    }

    // Check sharing type
    if (![2, 3, 4].includes(Number(sharingType))) {
      return res.status(400).json({
        message: "Sharing type must be 2, 3 or 4",
      });
    }

    // Find floor
    const floor = await Floor.findById(floorId);

    if (!floor) {
      return res.status(404).json({
        message: "Floor not found",
      });
    }

    // Find block
    const block = await Block.findById(floor.block);

    if (!block) {
      return res.status(404).json({
        message: "Block not found",
      });
    }

    // Check PG ownership
    const pg = await PG.findOne({
      _id: block.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // Check duplicate room
    const existingRoom = await Room.findOne({
      roomNumber: roomNumber.toUpperCase(),
    });

    if (existingRoom) {
      return res.status(409).json({
        message: "Room number already exists",
      });
    }

    // Create room
    const room = await Room.create({
      roomNumber: roomNumber.toUpperCase(),
      sharingType: Number(sharingType),
      totalBeds: Number(sharingType),
      floor: floorId,
    });

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      message: "Room creation failed",
      error: error.message,
    });
  }
});

app.post(
  "/api/blocks/:sourceBlockId/clone-to/:targetBlockId",
  authMiddleware,
  async (req, res) => {
    try {
      const { sourceBlockId, targetBlockId } = req.params;

      // 1. Find source block
      const sourceBlock = await Block.findById(sourceBlockId);

      if (!sourceBlock) {
        return res.status(404).json({
          message: "Source block not found",
        });
      }

      // 2. Find target block
      const targetBlock = await Block.findById(targetBlockId);

      if (!targetBlock) {
        return res.status(404).json({
          message: "Target block not found",
        });
      }

      // 3. Check both blocks belong to owner's PG
      const pg = await PG.findOne({
        _id: sourceBlock.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 4. Make sure target block belongs to same PG
      if (targetBlock.pg.toString() !== pg._id.toString()) {
        return res.status(400).json({
          message: "Source and target blocks must belong to the same PG",
        });
      }

      // 5. Get source floors
      const sourceFloors = await Floor.find({
        block: sourceBlock._id,
      }).sort({ floorNumber: 1 });

      if (sourceFloors.length === 0) {
        return res.status(400).json({
          message: "No floors found in source block",
        });
      }

      let createdFloors = [];
      let skippedFloors = [];
      let createdRooms = [];
      let skippedRooms = [];

      // 6. Clone floor by floor
      for (const sourceFloor of sourceFloors) {
        let targetFloor = await Floor.findOne({
          block: targetBlock._id,
          floorNumber: sourceFloor.floorNumber,
        });

        // Create target floor if missing
        if (!targetFloor) {
          targetFloor = await Floor.create({
            floorNumber: sourceFloor.floorNumber,
            block: targetBlock._id,
          });

          createdFloors.push(targetFloor.floorNumber);
        } else {
          skippedFloors.push(targetFloor.floorNumber);
        }

        // 7. Get rooms of source floor
        const sourceRooms = await Room.find({
          floor: sourceFloor._id,
        }).sort({ roomNumber: 1 });

        // 8. Clone rooms
        for (const sourceRoom of sourceRooms) {
          // Replace first character A → B
          const targetRoomNumber =
            sourceRoom.roomNumber.replace(/^A/, "B");

          const existingRoom = await Room.findOne({
            roomNumber: targetRoomNumber,
          });

          if (existingRoom) {
            skippedRooms.push(targetRoomNumber);
            continue;
          }

          const newRoom = await Room.create({
            roomNumber: targetRoomNumber,
            sharingType: sourceRoom.sharingType,
            totalBeds: sourceRoom.totalBeds,
            floor: targetFloor._id,
            status: sourceRoom.status,
          });

          createdRooms.push(newRoom.roomNumber);
        }
      }

      res.status(201).json({
        message: "Block structure cloned successfully",

        sourceBlock: sourceBlock.name,
        targetBlock: targetBlock.name,

        createdFloors,
        skippedFloors,

        createdRoomsCount: createdRooms.length,
        skippedRoomsCount: skippedRooms.length,

        createdRooms,
        skippedRooms,
      });
    } catch (error) {
      res.status(500).json({
        message: "Block cloning failed",
        error: error.message,
      });
    }
  }
);

// Generate all rooms for a block
app.post(
  "/api/blocks/:blockId/generate-rooms",
  authMiddleware,
  async (req, res) => {
    try {
      const { blockId } = req.params;

      // 1. Find block
      const block = await Block.findById(blockId);

      if (!block) {
        return res.status(404).json({
          message: "Block not found",
        });
      }

      // 2. Check PG ownership
      const pg = await PG.findOne({
        _id: block.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get all floors of this block
      const floors = await Floor.find({
        block: blockId,
      }).sort({ floorNumber: 1 });

      if (floors.length !== 5) {
        return res.status(400).json({
          message: "This block must have exactly 5 floors",
          floorsFound: floors.length,
        });
      }

      let createdRooms = [];
      let skippedRooms = [];

      // 4. Generate rooms floor by floor
      for (const floor of floors) {
        const prefix = block.name === "Block A" ? "A" : "B";

        const roomNumbers = [
          {
            roomNumber: `${prefix}${floor.floorNumber}01`,
            sharingType: 4,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}02`,
            sharingType: 4,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}03`,
            sharingType: 2,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}04`,
            sharingType: 3,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}05`,
            sharingType: 3,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}06`,
            sharingType: 3,
          },
          {
            roomNumber: `${prefix}${floor.floorNumber}07`,
            sharingType: 2,
          },
        ];

        for (const roomData of roomNumbers) {
          const existingRoom = await Room.findOne({
            roomNumber: roomData.roomNumber,
          });

          if (existingRoom) {
            skippedRooms.push(roomData.roomNumber);
            continue;
          }

          const room = await Room.create({
            roomNumber: roomData.roomNumber,
            sharingType: roomData.sharingType,
            totalBeds: roomData.sharingType,
            floor: floor._id,
          });

          createdRooms.push(room.roomNumber);
        }
      }

      res.status(201).json({
        message: "Rooms generated successfully",
        block: block.name,
        createdCount: createdRooms.length,
        skippedCount: skippedRooms.length,
        createdRooms,
        skippedRooms,
      });
    } catch (error) {
      res.status(500).json({
        message: "Room generation failed",
        error: error.message,
      });
    }
  }
);

// Generate beds for all rooms of a block
app.post(
  "/api/blocks/:blockId/generate-beds",
  authMiddleware,
  async (req, res) => {
    try {
      const { blockId } = req.params;

      // 1. Find block
      const block = await Block.findById(blockId);

      if (!block) {
        return res.status(404).json({
          message: "Block not found",
        });
      }

      // 2. Check PG ownership
      const pg = await PG.findOne({
        _id: block.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get all rooms of this block
      const floors = await Floor.find({
        block: blockId,
      });

      const floorIds = floors.map((floor) => floor._id);

      const rooms = await Room.find({
        floor: { $in: floorIds },
      });

      if (rooms.length === 0) {
        return res.status(400).json({
          message: "No rooms found in this block",
        });
      }

      let createdBeds = [];
      let skippedBeds = [];

      // 4. Generate beds room by room
      for (const room of rooms) {
        for (let i = 1; i <= room.totalBeds; i++) {
          const bedNumber = `${room.roomNumber}-B${i}`;

          const existingBed = await Bed.findOne({
            bedNumber,
          });

          if (existingBed) {
            skippedBeds.push(bedNumber);
            continue;
          }

          const bed = await Bed.create({
            bedNumber,
            room: room._id,
            status: "vacant",
            tenant: null,
          });

          createdBeds.push(bed.bedNumber);
        }
      }

      res.status(201).json({
        message: "Beds generated successfully",
        block: block.name,
        roomsFound: rooms.length,
        createdCount: createdBeds.length,
        skippedCount: skippedBeds.length,
        createdBeds,
        skippedBeds,
      });
    } catch (error) {
      res.status(500).json({
        message: "Bed generation failed",
        error: error.message,
      });
    }
  }
);

// Create tenant profile
app.post("/api/tenants", authMiddleware, async (req, res) => {
  try {
    const {
      userId,
      pgId,
      joiningDate,
      monthlyRent,
      emergencyContact,
    } = req.body;

    // 1. Check required fields
    if (!userId || !pgId || !joiningDate || monthlyRent === undefined) {
      return res.status(400).json({
        message: "User ID, PG ID, joining date and monthly rent are required",
      });
    }

    // 2. Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 3. User must be a tenant
    if (user.role !== "tenant") {
      return res.status(400).json({
        message: "User must have tenant role",
      });
    }

    // 4. Find PG owned by logged-in user
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 5. Check existing tenant profile
    const existingTenant = await Tenant.findOne({
      user: userId,
    });

    if (existingTenant) {
      return res.status(409).json({
        message: "Tenant profile already exists",
      });
    }

    // 6. Create tenant
    const tenant = await Tenant.create({
      user: userId,
      pg: pg._id,
      joiningDate,
      monthlyRent,
      advanceAmount: 3000,
      refundableAmount: 1500,
      maintenanceDeduction: 1500,
      emergencyContact,
    });

    res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      message: "Tenant creation failed",
      error: error.message,
    });
  }
});

// Assign bed to tenant
app.post("/api/tenants/:tenantId/assign-bed", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { bedId } = req.body;

    // 1. Bed ID required
    if (!bedId) {
      return res.status(400).json({
        message: "Bed ID is required",
      });
    }

    // 2. Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    // 3. Tenant must not already have a bed
    if (tenant.bed) {
      return res.status(400).json({
        message: "Tenant already has a bed assigned",
      });
    }

    // 4. Find bed
    const bed = await Bed.findById(bedId);

    if (!bed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    // 5. Bed must be vacant
    if (bed.status !== "vacant") {
      return res.status(400).json({
        message: "This bed is not available",
      });
    }

    // 5.1 Tenant must be active
    if (tenant.status !== "active") {
      return res.status(400).json({
        message: "Only active tenants can be assigned a bed",
      });
    }

    // 6. Get room
    const room = await Room.findById(bed.room);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    // Room must be active
    if (room.status !== "active") {
      return res.status(400).json({
        message: "This room is inactive",
      });
    }

    // 7. Get floor
    const floor = await Floor.findById(room.floor);

    if (!floor) {
      return res.status(404).json({
        message: "Floor not found",
      });
    }

    // 8. Get block
    const block = await Block.findById(floor.block);

    if (!block) {
      return res.status(404).json({
        message: "Block not found",
      });
    }

    // 9. Check PG
    const pg = await PG.findOne({
      _id: block.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 10. Check tenant belongs to same PG
    if (tenant.pg.toString() !== pg._id.toString()) {
      return res.status(400).json({
        message: "Tenant does not belong to this PG",
      });
    }

    // 11. Assign bed
    tenant.bed = bed._id;
    await tenant.save();

    // 12. Update bed
    bed.status = "occupied";
    bed.tenant = tenant.user;
    await bed.save();

    res.status(200).json({
      message: "Bed assigned successfully",
      allocation: {
        tenantId: tenant._id,
        bedId: bed._id,
        bedNumber: bed.bedNumber,
        roomNumber: room.roomNumber,
        floor: floor.floorNumber,
        block: block.name,
        pg: pg.name,
        status: bed.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Bed assignment failed",
      error: error.message,
    });
  }
});

// Get all beds of owner's PG
app.get("/api/pg/:pgId/beds", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // 1. Check PG ownership
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 2. Get blocks of this PG
    const blocks = await Block.find({
      pg: pgId,
    });

    const blockIds = blocks.map((block) => block._id);

    // 3. Get floors
    const floors = await Floor.find({
      block: { $in: blockIds },
    });

    const floorIds = floors.map((floor) => floor._id);

    // 4. Get rooms
    const rooms = await Room.find({
      floor: { $in: floorIds },
    });

    const roomIds = rooms.map((room) => room._id);

    // 5. Get beds
    const beds = await Bed.find({
      room: { $in: roomIds },
    })
      .populate("tenant", "name email phone")
      .populate("room", "roomNumber sharingType");

    res.status(200).json({
      message: "Beds fetched successfully",
      pg: pg.name,
      totalBeds: beds.length,
      vacantBeds: beds.filter((bed) => bed.status === "vacant").length,
      occupiedBeds: beds.filter((bed) => bed.status === "occupied").length,
      reservedBeds: beds.filter((bed) => bed.status === "reserved").length,
      beds,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch beds",
      error: error.message,
    });
  }
});


// Get complete Rooms & Beds structure of owner's PG
app.get("/api/pg/:pgId/rooms", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // 1. Verify PG ownership
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 2. Get all blocks
    const blocks = await Block.find({
      pg: pgId,
    }).sort({ createdAt: 1 });

    // 3. Build complete structure
    const roomsData = await Promise.all(
      blocks.map(async (block) => {
        const floors = await Floor.find({
          block: block._id,
        }).sort({ floorNumber: 1 });

        const floorsData = await Promise.all(
          floors.map(async (floor) => {
            const rooms = await Room.find({
              floor: floor._id,
            }).sort({ roomNumber: 1 });

            const roomsWithBeds = await Promise.all(
              rooms.map(async (room) => {
                const beds = await Bed.find({
                  room: room._id,
                })
                  .populate("tenant", "name email phone")
                  .sort({ bedNumber: 1 });

                return {
                  id: room._id,
                  roomNumber: room.roomNumber,
                  sharingType: room.sharingType,
                  totalBeds: room.totalBeds,
                  status: room.status,
                  beds: beds.map((bed) => ({
                    id: bed._id,
                    bedNumber: bed.bedNumber,
                    status: bed.status,
                    tenant: bed.tenant
                      ? {
                          id: bed.tenant._id,
                          name: bed.tenant.name,
                          email: bed.tenant.email,
                          phone: bed.tenant.phone,
                        }
                      : null,
                  })),
                };
              })
            );

            return {
              id: floor._id,
              floorNumber: floor.floorNumber,
              rooms: roomsWithBeds,
            };
          })
        );

        return {
          id: block._id,
          name: block.name,
          floors: floorsData,
        };
      })
    );

    // 4. Calculate statistics
    let totalRooms = 0;
    let totalBeds = 0;
    let vacantBeds = 0;
    let occupiedBeds = 0;
    let reservedBeds = 0;

    roomsData.forEach((block) => {
      block.floors.forEach((floor) => {
        totalRooms += floor.rooms.length;

        floor.rooms.forEach((room) => {
          totalBeds += room.beds.length;

          room.beds.forEach((bed) => {
            if (bed.status === "vacant") vacantBeds++;
            if (bed.status === "occupied") occupiedBeds++;
            if (bed.status === "reserved") reservedBeds++;
          });
        });
      });
    });

    // 5. Send response
    res.status(200).json({
      message: "Rooms and beds fetched successfully",

      pg: {
        id: pg._id,
        name: pg.name,
      },

      summary: {
        totalBlocks: blocks.length,
        totalRooms,
        totalBeds,
        vacantBeds,
        occupiedBeds,
        reservedBeds,
      },

      blocks: roomsData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch rooms and beds",
      error: error.message,
    });
  }
});


// Checkout tenant with settlement
app.post(
  "/api/tenants/:tenantId/checkout",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Find tenant
      const tenant = await Tenant.findById(tenantId);
    
      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Already checked out
      if (tenant.status === "checked_out") {
        return res.status(400).json({
          message: "Tenant has already checked out",
        });
      }

      // 4. Notice is required
      if (!tenant.noticeDate) {
        return res.status(400).json({
          message: "Tenant must give notice before checkout",
        });
      }

      // 5. Calculate notice days
      const today = new Date();
      const noticeDate = new Date(tenant.noticeDate);

      const differenceInMs = today - noticeDate;

      const noticeDays = Math.floor(
        differenceInMs / (1000 * 60 * 60 * 24)
      );

      // 6. 30-day notice check
      if (noticeDays < 30) {
        const remainingDays = 30 - noticeDays;

        return res.status(400).json({
          message: "30-day notice period is not completed",
          noticeDate,
          noticeDaysCompleted: noticeDays,
          remainingDays,
          nextMonthRentApplicable: true,
        });
      }

      // 7. Get assigned bed
      let bed = null;

      if (tenant.bed) {
        bed = await Bed.findById(tenant.bed);

        if (!bed) {
          return res.status(404).json({
            message: "Assigned bed not found",
          });
        }
      }

      // 8. Advance settlement
      const advanceAmount = tenant.advanceAmount || 3000;
      const maintenanceDeduction =
        tenant.maintenanceDeduction || 1500;

      const refundableAmount =
        advanceAmount - maintenanceDeduction;

      // 9. Record maintenance deduction
      await Payment.create({
        tenant: tenant._id,
        pg: pg._id,
        amount: maintenanceDeduction,
        paymentType: "maintenance",
        paymentMethod: "cash",
        paymentStatus: "paid",
        month: "checkout",
        notes: "Maintenance deduction from advance",
      });

      // 10. Record refund
      if (refundableAmount > 0) {
        await Payment.create({
          tenant: tenant._id,
          pg: pg._id,
          amount: refundableAmount,
          paymentType: "refund",
          paymentMethod: "cash",
          paymentStatus: "paid",
          month: "checkout",
          notes: "Advance refund to tenant",
        });
      }

      // 11. Release bed
      if (bed) {
        bed.status = "vacant";
        bed.tenant = null;

        await bed.save();
      }

      // 12. Checkout tenant
      tenant.checkoutDate = today;
      tenant.status = "checked_out";
      tenant.bed = null;

      await tenant.save();

      // 13. Response
      res.status(200).json({
        message: "Tenant checked out successfully",

        checkout: {
          tenantId: tenant._id,
          checkoutDate: today,

          advanceAmount,

          maintenanceDeduction,

          refundableAmount,

          bedReleased: !!bed,

          bedId: bed ? bed._id : null,

          status: tenant.status,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Checkout failed",
        error: error.message,
      });
    }
  }
);

// Record monthly rent payment
// ================= COLLECT PAYMENT =================
app.post("/api/payments", authMiddleware, async (req, res) => {
  try {
    const {
      tenantId,
      paymentMethod,
      month,
      transactionId,
      notes,
    } = req.body;

    // 1. Required fields
    if (!tenantId || !paymentMethod || !month) {
      return res.status(400).json({
        message: "Tenant ID, payment method and month are required",
      });
    }

    // 2. Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    // 3. Checked-out tenant cannot make payment
    if (tenant.status === "checked_out") {
      return res.status(400).json({
        message: "Cannot record payment for checked-out tenant",
      });
    }

    // 4. Verify PG owner
    const pg = await PG.findOne({
      _id: tenant.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 5. Check if rent is already paid for this month
    const existingRentPayment = await Payment.findOne({
      tenant: tenant._id,
      month,
      paymentType: "rent",
      paymentStatus: "paid",
    });

    // 6. Check if advance was already paid
    const existingAdvancePayment = await Payment.findOne({
      tenant: tenant._id,
      paymentType: "advance",
      paymentStatus: "paid",
    });

    const rentAlreadyPaid = !!existingRentPayment;
    const advanceAlreadyPaid = !!existingAdvancePayment;
    const joiningMonth = new Date(tenant.joiningDate)
      .toISOString()
      .slice(0, 7);

const isJoiningMonth = month === joiningMonth;

    // 7. Amounts from tenant profile
    const monthlyRent = tenant.monthlyRent || 0;
    const advanceAmount = tenant.advanceAmount || 0;

    // 8. Nothing left to collect
    if (rentAlreadyPaid && advanceAlreadyPaid) {
      return res.status(400).json({
        message: "Rent and advance are already paid",
      });
    }

    const paymentsCreated = [];

    // 9. Create rent payment if not already paid
    if (!rentAlreadyPaid) {
      const rentPayment = await Payment.create({
        tenant: tenant._id,
        pg: pg._id,
        amount: monthlyRent,
        paymentType: "rent",
        paymentMethod,
        paymentStatus: "paid",
        month,
        transactionId,
        notes,
      });

      paymentsCreated.push({
        type: "rent",
        amount: rentPayment.amount,
        paymentId: rentPayment._id,
      });
    }

    // 10. Create advance payment only if not already paid
    if (!advanceAlreadyPaid && advanceAmount > 0 && isJoiningMonth) {
      const advancePayment = await Payment.create({
        tenant: tenant._id,
        pg: pg._id,
        amount: advanceAmount,
        paymentType: "advance",
        paymentMethod,
        paymentStatus: "paid",
        month,
        transactionId,
        notes,
      });

      paymentsCreated.push({
        type: "advance",
        amount: advancePayment.amount,
        paymentId: advancePayment._id,
      });
    }

    // 11. Calculate total collected
    const totalCollected = paymentsCreated.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // 12. Success response
    res.status(201).json({
      message: "Payment recorded successfully",

      tenantId: tenant._id,

      month,

      payments: paymentsCreated,

      totalCollected,
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment creation failed",
      error: error.message,
    });
  }
});


// ================= GET PG PAYMENT HISTORY =================

app.get(
  "/api/pg/:pgId/payments",
  authMiddleware,
  async (req, res) => {
    try {
      const { pgId } = req.params;
      const { month, type } = req.query;

      // 1. Verify PG ownership
      const pg = await PG.findOne({
        _id: pgId,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 2. Create filter
      const filter = {
        pg: pgId,
        paymentStatus: "paid",
      };

      // Filter by month
      if (month) {
        filter.month = month;
      }

      // Filter by payment type
      if (type && type !== "all") {
        filter.paymentType = type;
      }

      // 3. Get payments with tenant and user details
      const payments = await Payment.find(filter)
        .populate({
          path: "tenant",
          populate: {
            path: "user",
            select: "name email phone",
          },
        })
        .sort({ paymentDate: -1 });

      // 4. Format response
      const formattedPayments = payments.map((payment) => ({
        paymentId: payment._id,

        tenant: {
          tenantId: payment.tenant?._id || null,
          name: payment.tenant?.user?.name || "Unknown",
          email: payment.tenant?.user?.email || null,
          phone: payment.tenant?.user?.phone || null,
        },

        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,

        month: payment.month,
        paymentDate: payment.paymentDate,

        transactionId: payment.transactionId,
        notes: payment.notes,
      }));

      // 5. Calculate total amount
      const totalAmount = formattedPayments.reduce(
        (total, payment) => total + payment.amount,
        0
      );

      res.status(200).json({
        message: "PG payment history fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
        },

        totalPayments: formattedPayments.length,
        totalAmount,

        payments: formattedPayments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch PG payment history",
        error: error.message,
      });
    }
  }
);


// Get tenant payment history
app.get(
  "/api/tenants/:tenantId/payments",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Find tenant
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get payments
      const payments = await Payment.find({
        tenant: tenant._id,
      }).sort({
        paymentDate: -1,
      });

      // 4. Calculate totals
      const totalPaid = payments
        .filter((payment) => payment.paymentStatus === "paid")
        .reduce((total, payment) => total + payment.amount, 0);

      const totalRent = payments
        .filter(
          (payment) =>
            payment.paymentType === "rent" &&
            payment.paymentStatus === "paid"
        )
        .reduce((total, payment) => total + payment.amount, 0);

      const totalAdvance = payments
        .filter(
          (payment) =>
            payment.paymentType === "advance" &&
            payment.paymentStatus === "paid"
        )
        .reduce((total, payment) => total + payment.amount, 0);

      res.status(200).json({
        message: "Payment history fetched successfully",

        tenant: {
          id: tenant._id,
          name: tenant.name,
        },

        summary: {
          totalPaid,
          totalRent,
          totalAdvance,
          totalPayments: payments.length,
        },

        payments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch payment history",
        error: error.message,
      });
    }
  }
);

// ================= GET SINGLE TENANT DETAILS =================

app.get(
  "/api/tenants/:tenantId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // Find tenant with complete details
      const tenant = await Tenant.findById(tenantId)
        .populate("user", "name email phone")
        .populate({
          path: "bed",
          populate: {
            path: "room",
            populate: {
              path: "floor",
              populate: {
                path: "block",
                select: "name",
              },
            },
          },
        });

      // Tenant not found
      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // Verify PG ownership
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to view this tenant",
        });
      }

      res.status(200).json({
        message: "Tenant details fetched successfully",

        tenant: {
          _id: tenant._id,

          name: tenant.user?.name || "Unknown",
          email: tenant.user?.email || "",
          phone: tenant.user?.phone || "",

          joiningDate: tenant.joiningDate,
          monthlyRent: tenant.monthlyRent,

          advanceAmount: tenant.advanceAmount,
          refundableAmount: tenant.refundableAmount,
          maintenanceDeduction: tenant.maintenanceDeduction,

          emergencyContact: tenant.emergencyContact,

          noticeDate: tenant.noticeDate,
          checkoutDate: tenant.checkoutDate,

          status: tenant.status,

          bed: tenant.bed
            ? {
                _id: tenant.bed._id,
                bedNumber: tenant.bed.bedNumber,

                room: tenant.bed.room
                  ? {
                      roomNumber: tenant.bed.room.roomNumber,
                      sharingType: tenant.bed.room.sharingType,

                      floor: tenant.bed.room.floor
                        ? {
                            floorNumber:
                              tenant.bed.room.floor.floorNumber,

                            block:
                              tenant.bed.room.floor.block
                                ? {
                                    name:
                                      tenant.bed.room.floor.block.name,
                                  }
                                : null,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch tenant details",
        error: error.message,
      });
    }
  }
);

// ================= PATCH SINGLE TENANT DETAILS EDIT=================
app.patch(
  "/api/tenants/:tenantId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      const {
        name,
        email,
        phone,
        monthlyRent,
        emergencyContact,
      } = req.body;

      // 1. Tenant find karo
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. PG ownership check
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to edit this tenant",
        });
      }

      // 3. Checked-out tenant edit nahi karna
      if (tenant.status === "checked_out") {
        return res.status(400).json({
          message: "Cannot edit a checked-out tenant",
        });
      }

      // 4. User find karo
      const user = await User.findById(tenant.user);

      if (!user) {
        return res.status(404).json({
          message: "Tenant user not found",
        });
      }

      // 5. Personal details update
      if (name !== undefined) {
        user.name = name;
      }

      if (email !== undefined) {
        user.email = email;
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      await user.save();

      // 6. Monthly rent update
      if (monthlyRent !== undefined) {
        if (Number(monthlyRent) < 0) {
          return res.status(400).json({
            message: "Monthly rent cannot be negative",
          });
        }

        tenant.monthlyRent = Number(monthlyRent);
      }

      // 7. Emergency contact update
      if (emergencyContact !== undefined) {
        tenant.emergencyContact = emergencyContact;
      }

      // 8. Save tenant
      await tenant.save();

      res.status(200).json({
        message: "Tenant updated successfully",

        tenant: {
          _id: tenant._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          monthlyRent: tenant.monthlyRent,
          emergencyContact: tenant.emergencyContact,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update tenant",
        error: error.message,
      });
    }
  }
);

// ================= GIVE NOTICE =================

app.patch(
  "/api/tenants/:tenantId/notice",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { checkoutDate } = req.body;

      // Find tenant
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to update this tenant",
        });
      }

      // Validate checkout date
      if (!checkoutDate) {
        return res.status(400).json({
          message: "Checkout date is required",
        });
      }

      // Update tenant
      tenant.status = "notice";
      tenant.noticeDate = new Date();
      tenant.checkoutDate = new Date(checkoutDate);

      await tenant.save();

      res.status(200).json({
        message: "Tenant notice added successfully",
        tenant,
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to add tenant notice",
        error: error.message,
      });
    }
  }
);

// ================= CANCEL TENANT NOTICE =================

app.patch(
  "/api/tenants/:tenantId/cancel-notice",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // Find tenant
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to update this tenant",
        });
      }

      // Check if tenant is actually on notice
      if (tenant.status !== "notice") {
        return res.status(400).json({
          message: "This tenant is not currently on notice",
        });
      }

      // Cancel notice
      tenant.status = "active";
      tenant.noticeDate = null;
      tenant.checkoutDate = null;

      await tenant.save();

      res.status(200).json({
        message: "Tenant notice cancelled successfully",
        tenant,
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to cancel tenant notice",
        error: error.message,
      });
    }
  }
);

// ================= EXTENDED CHECKOUT DATE =================
app.patch(
  "/api/tenants/:tenantId/extend-checkout",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { checkoutDate } = req.body;

      // 1. Tenant check
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Owner authorization check
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to update this tenant",
        });
      }

      // 3. Tenant must be on notice
      if (tenant.status !== "notice") {
        return res.status(400).json({
          message: "Tenant is not currently on notice",
        });
      }

      // 4. Checkout date required
      if (!checkoutDate) {
        return res.status(400).json({
          message: "New checkout date is required",
        });
      }

      // 5. Date validation
      const newCheckoutDate = new Date(checkoutDate);

      if (isNaN(newCheckoutDate.getTime())) {
        return res.status(400).json({
          message: "Invalid checkout date",
        });
      }

      // 6. New date must be after current checkout date
      if (
        tenant.checkoutDate &&
        newCheckoutDate <= new Date(tenant.checkoutDate)
      ) {
        return res.status(400).json({
          message: "New checkout date must be after the current checkout date",
        });
      }

      // 7. Update checkout date
      tenant.checkoutDate = newCheckoutDate;

      await tenant.save();

      res.status(200).json({
        message: "Checkout date extended successfully",
        tenant,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to extend checkout date",
        error: error.message,
      });
    }
  }
);

// ================= CHECKOUT SUMMARY =================
app.get(
  "/api/tenants/:tenantId/checkout-summary",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Tenant find karo
      const tenant = await Tenant.findById(tenantId)
        .populate("user", "name email phone");

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Owner authorization
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to view this checkout summary",
        });
      }

      // 3. Already checked out?
      if (tenant.status === "checked_out") {
        return res.status(400).json({
          message: "Tenant is already checked out",
        });
      }

      // 4. Actual checkout date = jis din owner checkout confirm karega
      const actualCheckoutDate = new Date();

      const year = actualCheckoutDate.getFullYear();
      const month = String(
        actualCheckoutDate.getMonth() + 1
      ).padStart(2, "0");

      const currentMonth = `${year}-${month}`;

      // 5. Tenant ke saare paid payments
      const payments = await Payment.find({
        tenant: tenant._id,
        paymentStatus: "paid",
      });

      // 6. Paid rent months
      const paidRentMonths = payments
        .filter((payment) => payment.paymentType === "rent")
        .map((payment) => payment.month);

      // 7. Check advance payment
      const advancePayment = payments.find(
        (payment) => payment.paymentType === "advance"
      );

      const advancePaid = !!advancePayment;

      // 8. Monthly rent
      const monthlyRent = Number(tenant.monthlyRent || 0);

      // 9. Joining month
      const joiningDate = new Date(tenant.joiningDate);

      const joiningYear = joiningDate.getFullYear();

      const joiningMonth = String(
        joiningDate.getMonth() + 1
      ).padStart(2, "0");

      const joiningMonthKey = `${joiningYear}-${joiningMonth}`;

      // 10. Previous unpaid rent months
      const pendingMonths = [];

      let checkDate = new Date(
        joiningDate.getFullYear(),
        joiningDate.getMonth(),
        1
      );

      const currentMonthDate = new Date(
        year,
        actualCheckoutDate.getMonth(),
        1
      );

      while (checkDate < currentMonthDate) {
        const checkYear = checkDate.getFullYear();

        const checkMonth = String(
          checkDate.getMonth() + 1
        ).padStart(2, "0");

        const monthKey = `${checkYear}-${checkMonth}`;

        if (!paidRentMonths.includes(monthKey)) {
          pendingMonths.push(monthKey);
        }

        checkDate.setMonth(checkDate.getMonth() + 1);
      }

      // 11. Previous pending rent
      const previousPendingRent =
        pendingMonths.length * monthlyRent;

      // 12. Current month rent
      let currentMonthRent = 0;

      /*
        Rule:
        - Checkout exactly on 1st = current month rent nahi
        - Checkout 2nd ya uske baad = current month rent lagega
        - Agar current month ka rent already paid hai = dobara nahi lagega
      */

      if (actualCheckoutDate.getDate() > 1) {
        if (!paidRentMonths.includes(currentMonth)) {
          currentMonthRent = monthlyRent;
        }
      }

      // 13. Total pending rent
      const totalPendingRent =
        previousPendingRent + currentMonthRent;

      // 14. Advance details
      const advanceAmount = Number(
        tenant.advanceAmount || 0
      );

      const refundableAmount = advancePaid
        ? Number(tenant.refundableAmount || 0)
        : 0;

      const maintenanceDeduction = advancePaid
        ? Number(tenant.maintenanceDeduction || 0)
        : 0;

      // 15. Final settlement
      const finalAmount =
        refundableAmount - totalPendingRent;

      let settlementType = "settled";

      if (finalAmount > 0) {
        settlementType = "refund";
      } else if (finalAmount < 0) {
        settlementType = "due";
      }

      res.status(200).json({
        message: "Checkout summary calculated successfully",

        summary: {
          tenantId: tenant._id,

          tenantName: tenant.user
            ? tenant.user.name
            : null,

          monthlyRent,

          joiningMonth: joiningMonthKey,

          currentMonth,

          currentMonthRent,

          pendingMonths,

          previousPendingRent,

          totalPendingRent,

          advanceAmount,

          advancePaid,

          refundableAmount,

          maintenanceDeduction,

          finalAmount: Math.abs(finalAmount),

          settlementType,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to calculate checkout summary",
        error: error.message,
      });
    }
  }
);

// ================= COMPLETE CHECKOUT =================
  app.patch(
  "/api/tenants/:tenantId/complete-checkout",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Tenant find karo
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Owner authorization
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(403).json({
          message: "You are not authorized to checkout this tenant",
        });
      }

      // 3. Tenant already checked out?
      if (tenant.status === "checked_out") {
        return res.status(400).json({
          message: "Tenant is already checked out",
        });
      }

      // 4. Tenant ke assigned bed ko find karo
      let bed = null;

      if (tenant.bed) {
        bed = await Bed.findById(tenant.bed);
      }

      // 5. Bed ko vacant karo
      if (bed) {
        bed.status = "vacant";
        bed.tenant = null;

        await bed.save();
      }

      // 6. Tenant checkout complete karo
      tenant.status = "checked_out";
      tenant.checkoutDate = tenant.checkoutDate || new Date();
      tenant.bed = null;

      await tenant.save();

      res.status(200).json({
        message: "Tenant checkout completed successfully",
        tenant,
        bed: bed
          ? {
              _id: bed._id,
              bedNumber: bed.bedNumber,
              status: bed.status,
            }
          : null,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to complete tenant checkout",
        error: error.message,
      });
    }
  }
);


// Monthly rent summary
app.get("/api/pg/:pgId/rent-summary", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "Month is required. Example: 2026-08",
      });
    }

    // 1. Verify PG owner
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 2. Get active tenants of this PG
    const tenants = await Tenant.find({
      pg: pgId,
      status: { $ne: "checked_out" },
    }).populate("user", "name email phone");

    // 3. Get paid rent payments for selected month
    const payments = await Payment.find({
      pg: pgId,
      month,
      paymentType: "rent",
      paymentStatus: "paid",
    });

    // 4. Create payment lookup
    const paidTenantIds = new Set(
      payments.map((payment) => payment.tenant.toString())
    );

    // 5. Calculate summary
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;

    const tenantSummary = tenants.map((tenant) => {
      const rent = tenant.monthlyRent || 0;
      const isPaid = paidTenantIds.has(tenant._id.toString());

      totalExpected += rent;

      if (isPaid) {
        totalCollected += rent;
      } else {
        totalPending += rent;
      }

      return {
        tenantId: tenant._id,
        name: tenant.user ? tenant.user.name : "Unknown",
        email: tenant.user ? tenant.user.email : null,
        monthlyRent: rent,
        status: isPaid ? "paid" : "pending",
      };
    });

    res.status(200).json({
      message: "Rent summary fetched successfully",

      pg: {
        id: pg._id,
        name: pg.name,
      },

      month,

      summary: {
        totalTenants: tenants.length,
        totalExpected,
        totalCollected,
        totalPending,
      },

      tenants: tenantSummary,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch rent summary",
      error: error.message,
    });
  }
});

// ================= PAYMENT OVERVIEW =================

app.get(
  "/api/pg/:pgId/payments-overview",
  authMiddleware,
  async (req, res) => {
    try {
      const { pgId } = req.params;
      const { month } = req.query;

      // 1. Month required
      if (!month) {
        return res.status(400).json({
          message: "Month is required. Example: 2026-09",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: pgId,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get all active / notice tenants
      const tenants = await Tenant.find({
        pg: pgId,
        status: { $ne: "checked_out" },
      }).populate("user", "name email phone");

      const paymentOverview = [];

      // 4. Process every tenant
      for (const tenant of tenants) {
        let roomDetails = null;

        // Get bed + room + floor + block details
        if (tenant.bed) {
          const bed = await Bed.findById(tenant.bed);

          if (bed) {
            const room = await Room.findById(bed.room);

            if (room) {
              const floor = await Floor.findById(room.floor);

              let block = null;

              if (floor) {
                block = await Block.findById(floor.block);
              }

              roomDetails = {
                bedId: bed._id,
                bedNumber: bed.bedNumber,

                roomId: room._id,
                roomNumber: room.roomNumber,
                sharingType: room.sharingType,

                floorNumber: floor
                  ? floor.floorNumber
                  : null,

                blockName: block
                  ? block.name
                  : null,
              };
            }
          }
        }

        // 5. Check rent payment for selected month
        const rentPayment = await Payment.findOne({
          tenant: tenant._id,
          month,
          paymentType: "rent",
          paymentStatus: "paid",
        });

        // 6. Check if advance was ever paid
        const advancePayment = await Payment.findOne({
          tenant: tenant._id,
          paymentType: "advance",
          paymentStatus: "paid",
        });

        const rentPaid = !!rentPayment;
        const advancePaid = !!advancePayment;

        const monthlyRent = tenant.monthlyRent || 0;
        const advanceAmount = tenant.advanceAmount || 0;

        // 7. Calculate payable amount
        let totalPayable = 0;

        if (!rentPaid) {
          totalPayable += monthlyRent;
        }

        if (!advancePaid) {
          totalPayable += advanceAmount;
        }

        paymentOverview.push({
          tenantId: tenant._id,

          tenant: {
            name: tenant.user
              ? tenant.user.name
              : "Unknown",

            email: tenant.user
              ? tenant.user.email
              : null,

            phone: tenant.user
              ? tenant.user.phone
              : null,
          },

          allocation: roomDetails,

          rent: {
            amount: monthlyRent,
            status: rentPaid ? "paid" : "pending",
          },

          advance: {
            amount: advanceAmount,
            status: advancePaid ? "paid" : "pending",

            refundableAmount:
              tenant.refundableAmount || 0,

            maintenanceDeduction:
              tenant.maintenanceDeduction || 0,
          },

          totalPayable,
        });
      }

      // 8. Send response
      res.status(200).json({
        message: "Payment overview fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
        },

        month,

        totalTenants: paymentOverview.length,

        tenants: paymentOverview,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch payment overview",
        error: error.message,
      });
    }
  }
);


// Tenant gives notice to leave PG
app.post(
  "/api/tenants/:tenantId/notice",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // Find tenant
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // Tenant already checked out
      if (tenant.status === "checked_out") {
        return res.status(400).json({
          message: "Tenant has already checked out",
        });
      }

      // Notice already given
      if (tenant.status === "notice") {
        return res.status(400).json({
          message: "Notice has already been given",
          noticeDate: tenant.noticeDate,
        });
      }

      // Notice starts today
      const noticeDate = new Date();

      // 30 days notice period
      const expectedCheckoutDate = new Date(noticeDate);
      expectedCheckoutDate.setDate(
        expectedCheckoutDate.getDate() + 30
      );

      // Update tenant
      tenant.noticeDate = noticeDate;
      tenant.status = "notice";

      await tenant.save();

      res.status(200).json({
        message: "Notice submitted successfully",

        notice: {
          tenantId: tenant._id,
          noticeDate,
          noticePeriodDays: 30,
          expectedCheckoutDate,
          status: tenant.status,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to submit notice",
        error: error.message,
      });
    }
  }
);

// Get tenants currently on notice
app.get("/api/pg/:pgId/notices", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // Verify PG owner
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // Get tenants on notice
    const tenants = await Tenant.find({
      pg: pgId,
      status: "notice",
      noticeDate: { $ne: null },
    }).populate("user", "name email phone");

    const today = new Date();

    const notices = tenants.map((tenant) => {
      const noticeDate = new Date(tenant.noticeDate);

      // Expected checkout = notice date + 30 days
      const expectedCheckoutDate = new Date(noticeDate);
      expectedCheckoutDate.setDate(
        expectedCheckoutDate.getDate() + 30
      );

      // Remaining days
      const differenceInMs =
        expectedCheckoutDate - today;

      const remainingDays = Math.max(
        0,
        Math.ceil(
          differenceInMs / (1000 * 60 * 60 * 24)
        )
      );

      return {
        tenantId: tenant._id,

        tenantName: tenant.user
          ? tenant.user.name
          : "Unknown",

        phone: tenant.user
          ? tenant.user.phone
          : null,

        noticeDate,

        expectedCheckoutDate,

        remainingDays,

        monthlyRent: tenant.monthlyRent,

        nextMonthRentApplicable:
          remainingDays > 0,

        status: tenant.status,
      };
    });

    res.status(200).json({
      message: "Notice list fetched successfully",

      pg: {
        id: pg._id,
        name: pg.name,
      },

      totalOnNotice: notices.length,

      notices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notice list",
      error: error.message,
    });
  }
});

// Record advance payment
app.post("/api/payments/advance", authMiddleware, async (req, res) => {
  try {
    const { tenantId, paymentMethod, transactionId, notes } = req.body;

    // 1. Required fields
    if (!tenantId || !paymentMethod) {
      return res.status(400).json({
        message: "Tenant ID and payment method are required",
      });
    }

    // 2. Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    // 3. Tenant must be active
    if (tenant.status === "checked_out") {
      return res.status(400).json({
        message: "Cannot record advance for checked-out tenant",
      });
    }

    // 4. Verify PG owner
    const pg = await PG.findOne({
      _id: tenant.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 5. Check if advance is already paid
    const existingAdvance = await Payment.findOne({
      tenant: tenant._id,
      paymentType: "advance",
      paymentStatus: "paid",
    });

    if (existingAdvance) {
      return res.status(409).json({
        message: "Advance payment is already recorded",
      });
    }

    // 6. Create advance payment
    const payment = await Payment.create({
      tenant: tenant._id,
      pg: pg._id,
      amount: 3000,
      paymentType: "advance",
      paymentMethod,
      paymentStatus: "paid",
      month: "joining",
      transactionId,
      notes,
    });

    res.status(201).json({
      message: "Advance payment recorded successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Advance payment failed",
      error: error.message,
    });
  }
});

// Get tenant's monthly rent
app.get("/api/tenants/:tenantId/rent", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;

    // 1. Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    // 2. Verify PG owner
    const pg = await PG.findOne({
      _id: tenant.pg,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 3. Tenant must have a bed
    if (!tenant.bed) {
      return res.status(400).json({
        message: "Tenant does not have a bed assigned",
      });
    }

    // 4. Find bed
    const bed = await Bed.findById(tenant.bed);

    if (!bed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    // 5. Find room
    const room = await Room.findById(bed.room);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    // 6. Calculate rent based on sharing
    let monthlyRent;

    if (room.sharingType === 2) {
      monthlyRent = 8000;
    } else if (room.sharingType === 3) {
      monthlyRent = 7000;
    } else if (room.sharingType === 4) {
      monthlyRent = 6000;
    }

    // 7. Update tenant rent
    tenant.monthlyRent = monthlyRent;
    await tenant.save();

    res.status(200).json({
      message: "Monthly rent calculated successfully",
      tenantId: tenant._id,
      roomNumber: room.roomNumber,
      sharingType: room.sharingType,
      monthlyRent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to calculate rent",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("PG Management Backend is running!");
});

app.post("/test", (req, res) => {
  console.log(req.body);

  res.json({
    message: "Data received successfully",
    data: req.body
  });
});

// PG Dashboard
app.get("/api/pg/:pgId/dashboard", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // Current month: YYYY-MM
    const now = new Date();

    const year = now.getFullYear();
    const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${monthNumber}`;

    // 1. Verify PG owner
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 2. Get property data
    const blocks = await Block.find({
      pg: pgId,
    });

    const blockIds = blocks.map((block) => block._id);

    const floors = await Floor.find({
      block: { $in: blockIds },
    });

    const floorIds = floors.map((floor) => floor._id);

    const rooms = await Room.find({
      floor: { $in: floorIds },
    });

    const roomIds = rooms.map((room) => room._id);

    const beds = await Bed.find({
      room: { $in: roomIds },
    });

    // 3. Bed statistics
    const totalBeds = beds.length;

    const occupiedBeds = beds.filter(
      (bed) => bed.status === "occupied"
    ).length;

    const vacantBeds = beds.filter(
      (bed) => bed.status === "vacant"
    ).length;

    const reservedBeds = beds.filter(
      (bed) => bed.status === "reserved"
    ).length;

    const occupancyRate =
      totalBeds > 0
        ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2))
        : 0;

    // 4. Tenant statistics
    const tenants = await Tenant.find({
      pg: pgId,
    }).populate("user", "name email phone");

    const activeTenants = tenants.filter(
      (tenant) => tenant.status === "active"
    );

    const noticeTenants = tenants.filter(
      (tenant) => tenant.status === "notice"
    );

    const checkedOutTenants = tenants.filter(
      (tenant) => tenant.status === "checked_out"
    );

    // 5. Current month rent payments
    const rentPayments = await Payment.find({
      pg: pgId,
      month: currentMonth,
      paymentType: "rent",
      paymentStatus: "paid",
    });

    // 6. Finance calculations
    const applicableTenants = tenants.filter(
      (tenant) =>
        tenant.status === "active" ||
        tenant.status === "notice"
    );

    const totalExpectedRent = applicableTenants.reduce(
      (total, tenant) => total + (tenant.monthlyRent || 0),
      0
    );

    const totalCollectedRent = rentPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    const totalPendingRent = Math.max(
      0,
      totalExpectedRent - totalCollectedRent
    );

    const collectionRate =
      totalExpectedRent > 0
        ? Number(
            ((totalCollectedRent / totalExpectedRent) * 100).toFixed(2)
          )
        : 0;

    // 7. Advance collected
    const advancePayments = await Payment.find({
      pg: pgId,
      paymentType: "advance",
      paymentStatus: "paid",
    });

    const totalAdvanceCollected = advancePayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // 8. Pending rent tenants
    const paidTenantIds = new Set(
      rentPayments.map((payment) => payment.tenant.toString())
    );

    const pendingRentTenants = activeTenants
      .filter(
        (tenant) => !paidTenantIds.has(tenant._id.toString())
      )
      .map((tenant) => ({
        tenantId: tenant._id,
        name: tenant.user ? tenant.user.name : "Unknown",
        monthlyRent: tenant.monthlyRent,
      }));

    // 9. Upcoming checkout dates
    const upcomingCheckouts = noticeTenants
      .map((tenant) => {
        if (!tenant.noticeDate) {
          return null;
        }

        const expectedCheckoutDate = new Date(
          tenant.noticeDate
        );

        expectedCheckoutDate.setDate(
          expectedCheckoutDate.getDate() + 30
        );

        const differenceInMs =
          expectedCheckoutDate - now;

        const remainingDays = Math.max(
          0,
          Math.ceil(
            differenceInMs / (1000 * 60 * 60 * 24)
          )
        );

        return {
          tenantId: tenant._id,
          name: tenant.user
            ? tenant.user.name
            : "Unknown",
          noticeDate: tenant.noticeDate,
          expectedCheckoutDate,
          remainingDays,
          monthlyRent: tenant.monthlyRent,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a.expectedCheckoutDate) -
          new Date(b.expectedCheckoutDate)
      );

    // 10. Recent payments
    const recentPayments = await Payment.find({
      pg: pgId,
    })
      .populate({
        path: "tenant",
        populate: {
          path: "user",
          select: "name",
        },
      })
      .sort({
        paymentDate: -1,
      })
      .limit(10);

    // 11. Recent tenants
    const recentTenants = await Tenant.find({
      pg: pgId,
    })
      .populate("user", "name email phone")
      .sort({
        createdAt: -1,
      })
      .limit(10);

    // 12. Property summary
    const property = {
      totalBlocks: blocks.length,
      totalFloors: floors.length,
      totalRooms: rooms.length,
      totalBeds,
    };

    // 13. Final dashboard response
    res.status(200).json({
      message: "Dashboard data fetched successfully",

      pg: {
        id: pg._id,
        name: pg.name,
        type: pg.type,
        address: pg.address,
      },

      period: {
        currentMonth,
      },

      overview: {
        totalBeds,
        occupiedBeds,
        vacantBeds,
        reservedBeds,
        occupancyRate,
      },

      tenants: {
        active: activeTenants.length,
        onNotice: noticeTenants.length,
        checkedOut: checkedOutTenants.length,
      },

      finance: {
        totalExpectedRent,
        totalCollectedRent,
        totalPendingRent,
        collectionRate,
        totalAdvanceCollected,
      },

      property,

      alerts: {
        pendingRentCount: pendingRentTenants.length,
        pendingRentTenants,
        upcomingCheckouts,
      },

      recentActivity: {
        payments: recentPayments,
        tenants: recentTenants,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

app.get("/api/pg/:pgId/tenants", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // Check PG ownership
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // Get all tenants
    const tenants = await Tenant.find({
      pg: pgId,
    })
      .populate("user", "name email phone")
      .populate({
        path: "bed",
        populate: {
          path: "room",
          populate: {
            path: "floor",
            populate: {
              path: "block",
              select: "name",
            },
          },
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tenants fetched successfully",
      count: tenants.length,
      tenants,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tenants",
      error: error.message,
    });
  }
});

// Get pending rent tenants
app.get(
  "/api/pg/:pgId/pending-rent",
  authMiddleware,
  async (req, res) => {
    try {
      const { pgId } = req.params;

      // Current month: YYYY-MM
      const now = new Date();

      const year = now.getFullYear();
      const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${monthNumber}`;

      // 1. Verify PG owner
      const pg = await PG.findOne({
        _id: pgId,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 2. Get active tenants
      const tenants = await Tenant.find({
        pg: pgId,
        status: "active",
      }).populate("user", "name email phone");

      // 3. Get current month's paid rent
      const payments = await Payment.find({
        pg: pgId,
        month: currentMonth,
        paymentType: "rent",
        paymentStatus: "paid",
      });

      // 4. IDs of tenants who already paid
      const paidTenantIds = new Set(
        payments.map((payment) => payment.tenant.toString())
      );

      // 5. Find pending tenants
      const pendingTenants = tenants
        .filter(
          (tenant) => !paidTenantIds.has(tenant._id.toString())
        )
        .map((tenant) => ({
          tenantId: tenant._id,

          name: tenant.user
            ? tenant.user.name
            : "Unknown",

          phone: tenant.user
            ? tenant.user.phone
            : null,

          email: tenant.user
            ? tenant.user.email
            : null,

          monthlyRent: tenant.monthlyRent,

          pendingAmount: tenant.monthlyRent,

          month: currentMonth,

          status: "pending",
        }));

      // 6. Total pending
      const totalPending = pendingTenants.reduce(
        (total, tenant) =>
          total + tenant.pendingAmount,
        0
      );

      // 7. Response
      res.status(200).json({
        message: "Pending rent fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
        },

        month: currentMonth,

        summary: {
          pendingTenants: pendingTenants.length,
          totalPending,
        },

        tenants: pendingTenants,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch pending rent",
        error: error.message,
      });
    }
  }
);

// Get complete tenant details
app.get(
  "/api/tenants/:tenantId/details",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Find tenant
      const tenant = await Tenant.findById(tenantId)
        .populate("user", "name email phone")
        .populate("pg", "name type address");

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg._id,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get bed
      let bedDetails = null;
      let roomDetails = null;
      let floorDetails = null;
      let blockDetails = null;

      if (tenant.bed) {
        const bed = await Bed.findById(tenant.bed);

        if (bed) {
          bedDetails = {
            id: bed._id,
            bedNumber: bed.bedNumber,
            status: bed.status,
          };

          // Room
          const room = await Room.findById(bed.room);

          if (room) {
            roomDetails = {
              id: room._id,
              roomNumber: room.roomNumber,
              sharingType: room.sharingType,
              totalBeds: room.totalBeds,
              status: room.status,
            };

            // Floor
            const floor = await Floor.findById(room.floor);

            if (floor) {
              floorDetails = {
                id: floor._id,
                floorNumber: floor.floorNumber,
              };

              // Block
              const block = await Block.findById(floor.block);

              if (block) {
                blockDetails = {
                  id: block._id,
                  name: block.name,
                };
              }
            }
          }
        }
      }

      // 4. Payment history
      const payments = await Payment.find({
        tenant: tenant._id,
      }).sort({
        paymentDate: -1,
      });

      // 5. Payment summary
      const totalPaid = payments
        .filter(
          (payment) => payment.paymentStatus === "paid"
        )
        .reduce(
          (total, payment) => total + payment.amount,
          0
        );

      const totalRentPaid = payments
        .filter(
          (payment) =>
            payment.paymentType === "rent" &&
            payment.paymentStatus === "paid"
        )
        .reduce(
          (total, payment) => total + payment.amount,
          0
        );

      const totalAdvancePaid = payments
        .filter(
          (payment) =>
            payment.paymentType === "advance" &&
            payment.paymentStatus === "paid"
        )
        .reduce(
          (total, payment) => total + payment.amount,
          0
        );

      const totalMaintenance = payments
        .filter(
          (payment) =>
            payment.paymentType === "maintenance" &&
            payment.paymentStatus === "paid"
        )
        .reduce(
          (total, payment) => total + payment.amount,
          0
        );

      // 6. Expected checkout date
      let expectedCheckoutDate = null;
      let remainingNoticeDays = null;

      if (tenant.noticeDate) {
        expectedCheckoutDate = new Date(
          tenant.noticeDate
        );

        expectedCheckoutDate.setDate(
          expectedCheckoutDate.getDate() + 30
        );

        const differenceInMs =
          expectedCheckoutDate - new Date();

        remainingNoticeDays = Math.max(
          0,
          Math.ceil(
            differenceInMs / (1000 * 60 * 60 * 24)
          )
        );
      }

      // 7. Final response
      res.status(200).json({
        message: "Tenant details fetched successfully",

        tenant: {
          id: tenant._id,

          profile: {
            name: tenant.user?.name || null,
            email: tenant.user?.email || null,
            phone: tenant.user?.phone || null,
          },

          pg: {
            id: tenant.pg._id,
            name: tenant.pg.name,
            type: tenant.pg.type,
            address: tenant.pg.address,
          },

          property: {
            block: blockDetails,
            floor: floorDetails,
            room: roomDetails,
            bed: bedDetails,
          },

          stay: {
            joiningDate: tenant.joiningDate,
            noticeDate: tenant.noticeDate,
            expectedCheckoutDate,
            checkoutDate: tenant.checkoutDate,
            remainingNoticeDays,
            status: tenant.status,
          },

          financial: {
            monthlyRent: tenant.monthlyRent,
            advanceAmount: tenant.advanceAmount,
            refundableAmount: tenant.refundableAmount,
            maintenanceDeduction:
              tenant.maintenanceDeduction,
          },

          paymentSummary: {
            totalPaid,
            totalRentPaid,
            totalAdvancePaid,
            totalMaintenance,
            totalPayments: payments.length,
          },

          emergencyContact: tenant.emergencyContact,
        },

        payments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch tenant details",
        error: error.message,
      });
    }
  }
);

// Update tenant basic details
app.put(
  "/api/tenants/:tenantId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      const {
        name,
        email,
        phone,
        emergencyContact,
      } = req.body;

      // 1. Find tenant
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Find linked user
      const user = await User.findById(tenant.user);

      if (!user) {
        return res.status(404).json({
          message: "User profile not found",
        });
      }

      // 4. Update basic user details
      if (name !== undefined) {
        user.name = name;
      }

      if (email !== undefined) {
        user.email = email.toLowerCase().trim();
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      await user.save();

      // 5. Update emergency contact
      if (emergencyContact !== undefined) {
        tenant.emergencyContact = {
          name: emergencyContact.name,
          phone: emergencyContact.phone,
          relation: emergencyContact.relation,
        };
      }

      await tenant.save();

      res.status(200).json({
        message: "Tenant details updated successfully",

        tenant: {
          id: tenant._id,

          profile: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },

          emergencyContact: tenant.emergencyContact,

          status: tenant.status,
        },
      });
    } catch (error) {
      // Duplicate email
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Email is already in use",
        });
      }

      res.status(500).json({
        message: "Failed to update tenant details",
        error: error.message,
      });
    }
  }
);

// Get all tenants of a PG
app.get("/api/pg/:pgId/tenants", authMiddleware, async (req, res) => {
  try {
    const { pgId } = req.params;

    // 1. Verify PG owner
    const pg = await PG.findOne({
      _id: pgId,
      owner: req.user.userId,
    });

    if (!pg) {
      return res.status(404).json({
        message: "PG not found or you are not the owner",
      });
    }

    // 2. Get all tenants
    const tenants = await Tenant.find({
      pg: pgId,
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    // 3. Get tenant property details
    const tenantList = [];

    for (const tenant of tenants) {
      let bedDetails = null;
      let roomDetails = null;
      let floorDetails = null;
      let blockDetails = null;

      if (tenant.bed) {
        const bed = await Bed.findById(tenant.bed);

        if (bed) {
          bedDetails = {
            id: bed._id,
            bedNumber: bed.bedNumber,
            status: bed.status,
          };

          const room = await Room.findById(bed.room);

          if (room) {
            roomDetails = {
              id: room._id,
              roomNumber: room.roomNumber,
              sharingType: room.sharingType,
              totalBeds: room.totalBeds,
            };

            const floor = await Floor.findById(room.floor);

            if (floor) {
              floorDetails = {
                id: floor._id,
                floorNumber: floor.floorNumber,
              };

              const block = await Block.findById(floor.block);

              if (block) {
                blockDetails = {
                  id: block._id,
                  name: block.name,
                };
              }
            }
          }
        }
      }

      let expectedCheckoutDate = null;

      if (tenant.noticeDate) {
        expectedCheckoutDate = new Date(tenant.noticeDate);

        expectedCheckoutDate.setDate(
          expectedCheckoutDate.getDate() + 30
        );
      }

      tenantList.push({
        tenantId: tenant._id,

        profile: {
          name: tenant.user?.name || null,
          email: tenant.user?.email || null,
          phone: tenant.user?.phone || null,
        },

        property: {
          block: blockDetails,
          floor: floorDetails,
          room: roomDetails,
          bed: bedDetails,
        },

        financial: {
          monthlyRent: tenant.monthlyRent,
          advanceAmount: tenant.advanceAmount,
          refundableAmount: tenant.refundableAmount,
          maintenanceDeduction: tenant.maintenanceDeduction,
        },

        stay: {
          joiningDate: tenant.joiningDate,
          noticeDate: tenant.noticeDate,
          expectedCheckoutDate,
          checkoutDate: tenant.checkoutDate,
          status: tenant.status,
        },
      });
    }

    // 4. Summary
    const activeCount = tenants.filter(
      (tenant) => tenant.status === "active"
    ).length;

    const noticeCount = tenants.filter(
      (tenant) => tenant.status === "notice"
    ).length;

    const checkedOutCount = tenants.filter(
      (tenant) => tenant.status === "checked_out"
    ).length;

    // 5. Response
    res.status(200).json({
      message: "Tenant list fetched successfully",

      pg: {
        id: pg._id,
        name: pg.name,
      },

      summary: {
        total: tenants.length,
        active: activeCount,
        onNotice: noticeCount,
        checkedOut: checkedOutCount,
      },

      tenants: tenantList,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tenant list",
      error: error.message,
    });
  }
});


// Get complete PG property hierarchy
app.get(
  "/api/pg/:pgId/property",
  authMiddleware,
  async (req, res) => {
    try {
      const { pgId } = req.params;

      // 1. Verify PG owner
      const pg = await PG.findOne({
        _id: pgId,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 2. Get all blocks
      const blocks = await Block.find({
        pg: pgId,
      }).sort({
        name: 1,
      });

      const property = [];

      let totalFloors = 0;
      let totalRooms = 0;
      let totalBeds = 0;
      let occupiedBeds = 0;
      let vacantBeds = 0;
      let reservedBeds = 0;

      // 3. Build hierarchy
      for (const block of blocks) {
        const floors = await Floor.find({
          block: block._id,
        }).sort({
          floorNumber: 1,
        });

        const floorList = [];

        for (const floor of floors) {
          const rooms = await Room.find({
            floor: floor._id,
          }).sort({
            roomNumber: 1,
          });

          const roomList = [];

          for (const room of rooms) {
            const beds = await Bed.find({
              room: room._id,
            })
              .populate("tenant", "name email phone")
              .sort({
                bedNumber: 1,
              });

            const bedList = beds.map((bed) => {
              if (bed.status === "occupied") {
                occupiedBeds++;
              } else if (bed.status === "vacant") {
                vacantBeds++;
              } else if (bed.status === "reserved") {
                reservedBeds++;
              }

              totalBeds++;

              return {
                id: bed._id,
                bedNumber: bed.bedNumber,
                status: bed.status,

                tenant: bed.tenant
                  ? {
                      id: bed.tenant._id,
                      name: bed.tenant.name,
                      email: bed.tenant.email,
                      phone: bed.tenant.phone,
                    }
                  : null,
              };
            });

            totalRooms++;

            roomList.push({
              id: room._id,
              roomNumber: room.roomNumber,
              sharingType: room.sharingType,
              totalBeds: room.totalBeds,
              status: room.status,

              occupancy: {
                occupied: bedList.filter(
                  (bed) => bed.status === "occupied"
                ).length,

                vacant: bedList.filter(
                  (bed) => bed.status === "vacant"
                ).length,

                reserved: bedList.filter(
                  (bed) => bed.status === "reserved"
                ).length,
              },

              beds: bedList,
            });
          }

          totalFloors++;

          floorList.push({
            id: floor._id,
            floorNumber: floor.floorNumber,
            totalRooms: roomList.length,
            rooms: roomList,
          });
        }

        property.push({
          id: block._id,
          name: block.name,
          totalFloors: floorList.length,
          floors: floorList,
        });
      }

      // 4. Occupancy percentage
      const occupancyRate =
        totalBeds > 0
          ? Number(
              ((occupiedBeds / totalBeds) * 100).toFixed(2)
            )
          : 0;

      // 5. Final response
      res.status(200).json({
        message: "Property data fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
          type: pg.type,
          address: pg.address,
        },

        summary: {
          totalBlocks: blocks.length,
          totalFloors,
          totalRooms,
          totalBeds,

          occupiedBeds,
          vacantBeds,
          reservedBeds,

          occupancyRate,
        },

        blocks: property,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch property data",
        error: error.message,
      });
    }
  }
);

// Get available beds of a PG
app.get(
  "/api/pg/:pgId/available-beds",
  authMiddleware,
  async (req, res) => {
    try {
      const { pgId } = req.params;

      // 1. Verify PG owner
      const pg = await PG.findOne({
        _id: pgId,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 2. Get blocks
      const blocks = await Block.find({
        pg: pgId,
      }).sort({
        name: 1,
      });

      const blockIds = blocks.map((block) => block._id);

      // 3. Get floors
      const floors = await Floor.find({
        block: { $in: blockIds },
      }).sort({
        floorNumber: 1,
      });

      const floorIds = floors.map((floor) => floor._id);

      // 4. Get rooms
      const rooms = await Room.find({
        floor: { $in: floorIds },
        status: "active",
      }).sort({
        roomNumber: 1,
      });

      const roomIds = rooms.map((room) => room._id);

      // 5. Get vacant beds
      const beds = await Bed.find({
        room: { $in: roomIds },
        status: "vacant",
      }).sort({
        bedNumber: 1,
      });

      // 6. Build easy frontend-friendly response
      const availableBeds = [];

      for (const bed of beds) {
        const room = rooms.find(
          (room) => room._id.toString() === bed.room.toString()
        );

        if (!room) continue;

        const floor = floors.find(
          (floor) => floor._id.toString() === room.floor.toString()
        );

        if (!floor) continue;

        const block = blocks.find(
          (block) => block._id.toString() === floor.block.toString()
        );

        if (!block) continue;

        availableBeds.push({
          bedId: bed._id,
          bedNumber: bed.bedNumber,

          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            sharingType: room.sharingType,
          },

          floor: {
            id: floor._id,
            floorNumber: floor.floorNumber,
          },

          block: {
            id: block._id,
            name: block.name,
          },

          status: bed.status,
        });
      }

      // 7. Response
      res.status(200).json({
        message: "Available beds fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
        },

        summary: {
          totalAvailableBeds: availableBeds.length,
        },

        beds: availableBeds,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch available beds",
        error: error.message,
      });
    }
  }
);

// Get complete room details
app.get(
  "/api/rooms/:roomId/details",
  authMiddleware,
  async (req, res) => {
    try {
      const { roomId } = req.params;

      // 1. Find room
      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          message: "Room not found",
        });
      }

      // 2. Find floor
      const floor = await Floor.findById(room.floor);

      if (!floor) {
        return res.status(404).json({
          message: "Floor not found",
        });
      }

      // 3. Find block
      const block = await Block.findById(floor.block);

      if (!block) {
        return res.status(404).json({
          message: "Block not found",
        });
      }

      // 4. Verify PG
      const pg = await PG.findOne({
        _id: block.pg,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 5. Get all beds in this room
      const beds = await Bed.find({
        room: room._id,
      })
        .populate("tenant", "name email phone")
        .sort({
          bedNumber: 1,
        });

      // 6. Bed statistics
      const occupiedBeds = beds.filter(
        (bed) => bed.status === "occupied"
      ).length;

      const vacantBeds = beds.filter(
        (bed) => bed.status === "vacant"
      ).length;

      const reservedBeds = beds.filter(
        (bed) => bed.status === "reserved"
      ).length;

      // 7. Format beds for frontend
      const bedList = beds.map((bed) => ({
        id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status,

        tenant: bed.tenant
          ? {
              id: bed.tenant._id,
              name: bed.tenant.name,
              email: bed.tenant.email,
              phone: bed.tenant.phone,
            }
          : null,
      }));

      // 8. Final response
      res.status(200).json({
        message: "Room details fetched successfully",

        pg: {
          id: pg._id,
          name: pg.name,
        },

        location: {
          block: {
            id: block._id,
            name: block.name,
          },

          floor: {
            id: floor._id,
            floorNumber: floor.floorNumber,
          },
        },

        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          sharingType: room.sharingType,
          totalBeds: room.totalBeds,
          status: room.status,
        },

        occupancy: {
          totalBeds: beds.length,
          occupiedBeds,
          vacantBeds,
          reservedBeds,

          occupancyRate:
            beds.length > 0
              ? Number(
                  ((occupiedBeds / beds.length) * 100).toFixed(2)
                )
              : 0,
        },

        beds: bedList,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch room details",
        error: error.message,
      });
    }
  }
);

// Get tenant payment and rent status
app.get(
  "/api/tenants/:tenantId/payment-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      // 1. Find tenant
      const tenant = await Tenant.findById(tenantId)
        .populate("user", "name email phone")
        .populate("pg", "name type address");

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found",
        });
      }

      // 2. Verify PG owner
      const pg = await PG.findOne({
        _id: tenant.pg._id,
        owner: req.user.userId,
      });

      if (!pg) {
        return res.status(404).json({
          message: "PG not found or you are not the owner",
        });
      }

      // 3. Get all payments
      const payments = await Payment.find({
        tenant: tenant._id,
      }).sort({
        paymentDate: -1,
      });

      // 4. Separate payment types
      const rentPayments = payments.filter(
        (payment) =>
          payment.paymentType === "rent" &&
          payment.paymentStatus === "paid"
      );

      const advancePayments = payments.filter(
        (payment) =>
          payment.paymentType === "advance" &&
          payment.paymentStatus === "paid"
      );

      const maintenancePayments = payments.filter(
        (payment) =>
          payment.paymentType === "maintenance" &&
          payment.paymentStatus === "paid"
      );

      // 5. Calculate totals
      const totalRentPaid = rentPayments.reduce(
        (total, payment) => total + payment.amount,
        0
      );

      const totalAdvancePaid = advancePayments.reduce(
        (total, payment) => total + payment.amount,
        0
      );

      const totalMaintenancePaid = maintenancePayments.reduce(
        (total, payment) => total + payment.amount,
        0
      );

      // 6. Current month
      const now = new Date();

      const year = now.getFullYear();
      const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${monthNumber}`;

      // 7. Current month rent
      const currentMonthRentPayments = rentPayments.filter(
        (payment) => payment.month === currentMonth
      );

      const currentMonthPaid = currentMonthRentPayments.reduce(
        (total, payment) => total + payment.amount,
        0
      );

      const currentMonthPending = Math.max(
        0,
        tenant.monthlyRent - currentMonthPaid
      );

      // 8. Build month-wise rent history
      const rentByMonth = {};

      rentPayments.forEach((payment) => {
        if (!rentByMonth[payment.month]) {
          rentByMonth[payment.month] = {
            month: payment.month,
            amountPaid: 0,
            status: "paid",
            payments: [],
          };
        }

        rentByMonth[payment.month].amountPaid += payment.amount;

        rentByMonth[payment.month].payments.push({
          paymentId: payment._id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          transactionId: payment.transactionId,
          notes: payment.notes,
        });
      });

      // 9. Add current month if no payment exists
      if (!rentByMonth[currentMonth]) {
        rentByMonth[currentMonth] = {
          month: currentMonth,
          amountPaid: 0,
          status: "pending",
          payments: [],
        };
      }

      // 10. Correct partial/full payment status
      Object.values(rentByMonth).forEach((monthData) => {
        if (monthData.amountPaid >= tenant.monthlyRent) {
          monthData.status = "paid";
        } else if (monthData.amountPaid > 0) {
          monthData.status = "partial";
        } else {
          monthData.status = "pending";
        }

        monthData.pendingAmount = Math.max(
          0,
          tenant.monthlyRent - monthData.amountPaid
        );
      });

      // 11. Sort newest month first
      const monthlyRentHistory = Object.values(
        rentByMonth
      ).sort((a, b) => b.month.localeCompare(a.month));

      // 12. Final response
      res.status(200).json({
        message: "Tenant payment status fetched successfully",

        tenant: {
          id: tenant._id,
          name: tenant.user?.name || null,
          phone: tenant.user?.phone || null,
          status: tenant.status,
          monthlyRent: tenant.monthlyRent,
        },

        currentMonth: {
          month: currentMonth,
          monthlyRent: tenant.monthlyRent,
          paid: currentMonthPaid,
          pending: currentMonthPending,
          status:
            currentMonthPaid >= tenant.monthlyRent
              ? "paid"
              : currentMonthPaid > 0
              ? "partial"
              : "pending",
        },

        summary: {
          totalRentPaid,
          totalAdvancePaid,
          totalMaintenancePaid,
          totalPayments: payments.length,
        },

        monthlyRentHistory,

        payments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch tenant payment status",
        error: error.message,
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});